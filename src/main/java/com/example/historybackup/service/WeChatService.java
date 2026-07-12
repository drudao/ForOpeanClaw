package com.example.historybackup.service;

import com.example.historybackup.model.HistoryRecord;
import com.example.historybackup.repository.HistoryRecordRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.*;
import java.net.HttpURLConnection;
import java.net.URI;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.*;

/**
 * 微信公众平台 API 服务
 */
@Service
public class WeChatService {

    private static final Logger log = LoggerFactory.getLogger(WeChatService.class);

    private static final String WECHAT_API = "https://api.weixin.qq.com/cgi-bin";

    @Value("${wechat.appid:}")
    private String appId;

    @Value("${wechat.secret:}")
    private String secret;

    private final HistoryRecordRepository repository;

    private String accessToken;
    private long tokenExpireTime;

    public WeChatService(HistoryRecordRepository repository) {
        this.repository = repository;
    }

    /**
     * 获取 access_token（自动缓存，过期续期）
     */
    private synchronized String getToken() throws IOException {
        if (accessToken != null && System.currentTimeMillis() < tokenExpireTime) {
            return accessToken;
        }

        if (appId.isEmpty() || secret.isEmpty()) {
            // 从配置文件读取
            appId = getConfig("wechat.appid");
            secret = getConfig("wechat.secret");
        }

        String urlStr = WECHAT_API + "/token?grant_type=client_credential&appid="
                + appId + "&secret=" + secret;

        String json = httpGet(urlStr);
        // 简单的 JSON 解析
        if (json.contains("access_token")) {
            accessToken = extractJsonValue(json, "access_token");
            int expiresIn = Integer.parseInt(extractJsonValue(json, "expires_in"));
            tokenExpireTime = System.currentTimeMillis() + (expiresIn - 60) * 1000L;
            log.info("微信 access_token 获取成功，有效期 {} 秒", expiresIn);
            return accessToken;
        } else {
            String errMsg = json.contains("errmsg") ? extractJsonValue(json, "errmsg") : json;
            log.error("微信 token 获取失败: {}", errMsg);
            throw new IOException("微信 token 获取失败: " + errMsg);
        }
    }

    /**
     * 上传永久图片素材
     */
    public String uploadImage(byte[] imageData, String fileName) throws IOException {
        String token = getToken();
        String boundary = "----WebKitFormBoundary" + UUID.randomUUID().toString().replace("-", "");

        URL url = URI.create(WECHAT_API + "/material/add_material?access_token=" + token + "&type=image").toURL();
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("POST");
        conn.setDoOutput(true);
        conn.setRequestProperty("Content-Type", "multipart/form-data; boundary=" + boundary);

        String headerPart = "--" + boundary + "\r\n"
                + "Content-Disposition: form-data; name=\"media\"; filename=\"" + fileName + "\"\r\n"
                + "Content-Type: image/png\r\n\r\n";
        String footerPart = "\r\n--" + boundary + "--\r\n";

        ByteArrayOutputStream bos = new ByteArrayOutputStream();
        bos.write(headerPart.getBytes(StandardCharsets.UTF_8));
        bos.write(imageData);
        bos.write(footerPart.getBytes(StandardCharsets.UTF_8));

        conn.setFixedLengthStreamingMode(bos.size());
        try (OutputStream os = conn.getOutputStream()) {
            os.write(bos.toByteArray());
        }

        String response = readResponse(conn);
        log.info("上传图片响应: {}", response);

        if (response.contains("media_id")) {
            return extractJsonValue(response, "media_id");
        } else if (response.contains("url")) {
            return extractJsonValue(response, "url");
        } else {
            String errMsg = response.contains("errmsg") ? extractJsonValue(response, "errmsg") : response;
            throw new IOException("上传图片失败: " + errMsg);
        }
    }

    /**
     * 创建草稿（图文消息）
     */
    public String createDraft(String title, String content, String thumbMediaId) throws IOException {
        String token = getToken();

        String body = "{"
                + "\"articles\":[{\"title\":\"" + escapeJson(title) + "\","
                + "\"content\":\"" + escapeJson(content) + "\","
                + "\"thumb_media_id\":\"" + thumbMediaId + "\","
                + "\"show_cover_pic\":1,"
                + "\"need_open_comment\":0,"
                + "\"only_fans_can_comment\":0}]}";

        String urlStr = WECHAT_API + "/draft/add?access_token=" + token;
        String json = httpPost(urlStr, body);
        log.info("创建草稿响应: {}", json);

        if (json.contains("media_id")) {
            return extractJsonValue(json, "media_id");
        } else {
            String errMsg = json.contains("errmsg") ? extractJsonValue(json, "errmsg") : json;
            throw new IOException("创建草稿失败: " + errMsg);
        }
    }

    /**
     * 处理截图并发送到公众号
     */
    public Map<String, Object> sendScreenshotToWeChat(String imageBase64, List<Long> selectedIds, String keyword) {
        Map<String, Object> result = new HashMap<>();
        try {
            // 1. 解码 base64 图片
            String base64Data = imageBase64;
            if (base64Data.contains(",")) {
                base64Data = base64Data.split(",")[1];
            }
            byte[] imageBytes = Base64.getDecoder().decode(base64Data);

            // 2. 上传图片作为永久素材
            String mediaId = uploadImage(imageBytes, "history_screenshot.png");

            // 3. 获取选中记录信息
            List<HistoryRecord> selectedRecords = repository.findAllById(selectedIds);

            // 4. 构建文章内容
            StringBuilder content = new StringBuilder();
            content.append("<h2>浏览器历史记录 - 选中数据截图</h2>");
            if (!keyword.isEmpty()) {
                content.append("<p>搜索关键词: <strong>").append(escapeHtml(keyword)).append("</strong></p>");
            }
            content.append("<p>选中 ").append(selectedRecords.size()).append(" 条记录</p>");
            content.append("<hr/>");
            content.append("<p style=\"text-align:center\"><img src=\"{{image_url}}\" alt=\"截图\" style=\"max-width:100%%\"/></p>");
            content.append("<hr/>");
            content.append("<h3>选中记录详情</h3>");
            content.append("<table border=\"1\" cellpadding=\"5\" cellspacing=\"0\" style=\"border-collapse:collapse;width:100%%;font-size:13px\">");
            content.append("<tr><th>#</th><th>标题</th><th>URL</th><th>访问时间</th></tr>");
            int idx = 1;
            for (HistoryRecord r : selectedRecords) {
                content.append("<tr>");
                content.append("<td>").append(idx++).append("</td>");
                content.append("<td>").append(escapeHtml(r.getTitle())).append("</td>");
                content.append("<td>").append(escapeHtml(r.getUrl())).append("</td>");
                content.append("<td>").append(r.getVisitTime()).append("</td>");
                content.append("</tr>");
            }
            content.append("</table>");

            // 5. 创建草稿
            String title = "浏览器历史记录备份 - " + new java.text.SimpleDateFormat("yyyy-MM-dd HH:mm").format(new java.util.Date());
            String articleId = createDraft(title, content.toString(), mediaId);

            result.put("success", true);
            result.put("articleId", articleId);
            result.put("message", "发送成功");
            log.info("截图已发送到公众号草稿，文章ID: {}", articleId);
        } catch (Exception e) {
            log.error("发送到公众号失败", e);
            result.put("success", false);
            result.put("message", e.getMessage());
        }
        return result;
    }

    // ==================== 工具方法 ====================

    private String httpGet(String urlStr) throws IOException {
        URL url = URI.create(urlStr).toURL();
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("GET");
        conn.setConnectTimeout(10000);
        conn.setReadTimeout(10000);
        return readResponse(conn);
    }

    private String httpPost(String urlStr, String body) throws IOException {
        URL url = URI.create(urlStr).toURL();
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("POST");
        conn.setDoOutput(true);
        conn.setRequestProperty("Content-Type", "application/json; charset=UTF-8");
        conn.setConnectTimeout(10000);
        conn.setReadTimeout(10000);
        try (OutputStream os = conn.getOutputStream()) {
            os.write(body.getBytes(StandardCharsets.UTF_8));
        }
        return readResponse(conn);
    }

    private String readResponse(HttpURLConnection conn) throws IOException {
        try (BufferedReader br = new BufferedReader(
                new InputStreamReader(conn.getResponseCode() >= 400
                        ? conn.getErrorStream() : conn.getInputStream(), StandardCharsets.UTF_8))) {
            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = br.readLine()) != null) {
                sb.append(line);
            }
            return sb.toString();
        }
    }

    private String extractJsonValue(String json, String key) {
        String searchKey = "\"" + key + "\":\"";
        int start = json.indexOf(searchKey);
        if (start < 0) {
            // 尝试无引号的值（数字/布尔）
            searchKey = "\"" + key + "\":";
            start = json.indexOf(searchKey);
            if (start < 0) return "";
            start += searchKey.length();
            int end = json.indexOf(",", start);
            if (end < 0) end = json.indexOf("}", start);
            if (end < 0) end = json.length();
            return json.substring(start, end).trim();
        }
        start += searchKey.length();
        int end = json.indexOf("\"", start);
        return end > start ? json.substring(start, end) : "";
    }

    private String escapeJson(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }

    private String escapeHtml(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;");
    }

    private String getConfig(String key) {
        try {
            // 尝试读取系统属性或环境变量
            String val = System.getProperty(key);
            if (val != null && !val.isEmpty()) return val;
            val = System.getenv(key.toUpperCase().replace(".", "_"));
            if (val != null && !val.isEmpty()) return val;
            // 从文件读取
            File configFile = new File(System.getProperty("user.dir"), "wechat-config.json");
            if (configFile.exists()) {
                String json = new String(java.nio.file.Files.readAllBytes(configFile.toPath()), StandardCharsets.UTF_8);
                String searchKey = "\"" + key.replace("wechat.", "") + "\":\"";
                int start = json.indexOf(searchKey);
                if (start > 0) {
                    start += searchKey.length();
                    int end = json.indexOf("\"", start);
                    return json.substring(start, end);
                }
            }
        } catch (Exception e) {
            log.warn("读取配置 {} 失败: {}", key, e.getMessage());
        }
        return "";
    }
}
