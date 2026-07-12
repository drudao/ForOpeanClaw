package com.example.historybackup.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.*;
import java.util.concurrent.TimeUnit;

/**
 * 处理选中 URL 截图并通过 WeChatService 发送到公众号草稿
 */
@Service
public class WeChatUrlService {

    private static final Logger log = LoggerFactory.getLogger(WeChatUrlService.class);

    private final WeChatService weChatService;

    @Value("${screenshot.nodejs:node}")
    private String nodeCommand;

    @Value("${screenshot.script:docs/screenshot.js}")
    private String screenshotScript;

    public WeChatUrlService(WeChatService weChatService) {
        this.weChatService = weChatService;
    }

    /**
     * 对单个 URL 截图并上传到微信，返回草稿 media_id
     */
    public Map<String, Object> processUrl(String url, String title, int index, int total) {
        Map<String, Object> result = new HashMap<>();
        result.put("url", url);
        result.put("title", title);

        Path tempFile = null;
        try {
            // 1. 创建临时文件存放截图
            tempFile = Files.createTempFile("screenshot_" + index + "_", ".png");

            // 2. 调用 Node.js Puppeteer 截图
            String scriptPath = resolveScriptPath();
            log.info("[{}/{}] 开始截图: {} -> {}", index + 1, total, title, url);

            ProcessBuilder pb = new ProcessBuilder(
                    nodeCommand,
                    scriptPath,
                    url,
                    tempFile.toAbsolutePath().toString()
            );
            pb.directory(new File(System.getProperty("user.dir")));
            pb.redirectErrorStream(true);

            Process process = pb.start();
            boolean finished = process.waitFor(60, TimeUnit.SECONDS);
            if (!finished) {
                process.destroyForcibly();
                throw new IOException("截图超时 (60s): " + url);
            }

            String output = new String(process.getInputStream().readAllBytes(), java.nio.charset.StandardCharsets.UTF_8).trim();
            log.info("截图脚本输出: {}", output);

            if (process.exitValue() != 0 && !output.startsWith("PARTIAL")) {
                throw new IOException("截图失败 (exit=" + process.exitValue() + "): " + output);
            }

            // 3. 读取截图文件
            byte[] imageBytes = Files.readAllBytes(tempFile);
            if (imageBytes.length == 0) {
                throw new IOException("截图文件为空: " + url);
            }

            log.info("[{}/{}] 截图完成: {} ({} bytes)", index + 1, total, url, imageBytes.length);

            // 4. 上传到微信作为图片素材
            Map<String, String> uploadResult = weChatService.uploadImage(imageBytes, "screenshot_" + index + ".png");
            String mediaId = uploadResult.get("media_id");
            String imageUrl = uploadResult.getOrDefault("url", "");
            log.info("[{}/{}] 图片上传成功, media_id: {}, url: {}", index + 1, total, mediaId, imageUrl);

            // 5. 创建草稿文章
            String articleTitle = (title != null && !title.isEmpty()) ? title : url;
            String content = buildDraftContent(articleTitle, url, imageUrl);
            log.info(">>>>>> [processUrl] Calling createDraft with title='{}', mediaId='{}', content.length()={}",
                    articleTitle, mediaId, content.length());
            String articleId = weChatService.createDraft(articleTitle, content, mediaId);
            log.info("[{}/{}] 草稿创建成功, article_id: {}", index + 1, total, articleId);

            result.put("status", "success");
            result.put("articleId", articleId);
            result.put("mediaId", mediaId);
            result.put("imageSize", imageBytes.length);
        } catch (Exception e) {
            log.error("处理 URL 失败: {} - {}", url, e.getMessage());
            result.put("status", "failed");
            result.put("error", e.getMessage());
        } finally {
            // 清理临时文件
            if (tempFile != null) {
                try {
                    Files.deleteIfExists(tempFile);
                } catch (IOException ignored) {}
            }
        }

        return result;
    }

    /**
     * 批量处理 URL 列表
     */
    public List<Map<String, Object>> processUrls(List<Map<String, String>> urlItems) {
        List<Map<String, Object>> results = new ArrayList<>();
        int total = urlItems.size();

        for (int i = 0; i < total; i++) {
            Map<String, String> item = urlItems.get(i);
            String url = item.get("url");
            String title = item.getOrDefault("title", "");
            Map<String, Object> r = processUrl(url, title, i, total);
            results.add(r);
        }

        return results;
    }

    /**
     * 构建图文消息内容 - 包含截图和原文链接
     */
    private String buildDraftContent(String title, String url, String imageUrl) {
        StringBuilder sb = new StringBuilder();
        sb.append("<h2>").append(escapeHtml(title)).append("</h2>");
        sb.append("<hr/>");
        if (imageUrl != null && !imageUrl.isEmpty()) {
            sb.append("<p style=\"text-align:center\"><img src=\"")
              .append(escapeHtml(imageUrl))
              .append("\" alt=\"页面截图\" style=\"max-width:100%\"/></p>");
        }
        sb.append("<hr/>");
        sb.append("<p>原文链接: <a href=\"").append(escapeHtml(url)).append("\">")
          .append(escapeHtml(url)).append("</a></p>");
        sb.append("<p>抓取时间: ")
          .append(new java.text.SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(new java.util.Date()))
          .append("</p>");
        return sb.toString();
    }

    private String resolveScriptPath() {
        // Try the configured path relative to user.dir first
        String configured = screenshotScript;
        File f = new File(System.getProperty("user.dir"), configured);
        if (f.exists()) {
            return f.getAbsolutePath();
        }
        // Fallback to the docs directory relative to user.dir
        f = new File(System.getProperty("user.dir"), "docs/screenshot.js");
        if (f.exists()) {
            return f.getAbsolutePath();
        }
        // Return configured path as-is
        return configured;
    }

    private static String escapeHtml(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;");
    }
}
