#!/usr/bin/env node
/**
 * ClickUp Integration System - Node.js Backend
 * WhatsApp Bot + ClickUp Webhooks + AI Content Generator
 *
 * @version 2.0
 * @author ClickUp Integration Team
 */

const express = require('express');
const axios = require('axios');
const cron = require('node-cron');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

// ============================================================================
// CONFIGURATION
// ============================================================================

const PORT = process.env.PORT || 5014;
const CLICKUP_TOKEN = process.env.CLICKUP_TOKEN;
const CLICKUP_TEAM_ID = process.env.CLICKUP_TEAM_ID;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const WHATSAPP_GROUP_NAME = process.env.WHATSAPP_GROUP_NAME || 'Click Up notification 📢';
const SAMPLE_LIST_ID = process.env.SAMPLE_LIST_ID;

// ClickUp API Base URL
const CLICKUP_API_BASE = 'https://api.clickup.com/api/v2';

// User mappings (ClickUp ID => WhatsApp number)
const USER_PHONE_MAP = {
    '62585187': process.env.USER_1_PHONE || '',
    '74558888': process.env.USER_2_PHONE || '',
    '74558852': process.env.USER_3_PHONE || ''
};

// User name mappings
const USER_NAME_MAP = {
    '62585187': process.env.USER_1_NAME || 'User 1',
    '74558888': process.env.USER_2_NAME || 'User 2',
    '74558852': process.env.USER_3_NAME || 'User 3'
};

// ============================================================================
// EXPRESS APP SETUP
// ============================================================================

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================================================
// WHATSAPP CLIENT SETUP
// ============================================================================

const client = new Client({
    authStrategy: new LocalAuth({
        clientId: 'clickup-bot'
    }),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu'
        ]
    }
});

let isWhatsAppReady = false;
let groupChat = null;

// WhatsApp event handlers
client.on('qr', (qr) => {
    console.log('📱 WhatsApp QR Code:');
    qrcode.generate(qr, { small: true });
    console.log('Scan the QR code above with your WhatsApp');
});

client.on('ready', async () => {
    console.log('✅ WhatsApp Client is ready!');
    isWhatsAppReady = true;

    // Find the group chat
    try {
        const chats = await client.getChats();
        groupChat = chats.find(chat => chat.isGroup && chat.name === WHATSAPP_GROUP_NAME);

        if (groupChat) {
            console.log(`✅ Found group: ${WHATSAPP_GROUP_NAME}`);
        } else {
            console.warn(`⚠️ Group "${WHATSAPP_GROUP_NAME}" not found`);
        }
    } catch (error) {
        console.error('Error finding group chat:', error);
    }
});

client.on('authenticated', () => {
    console.log('✅ WhatsApp authenticated');
});

client.on('auth_failure', (msg) => {
    console.error('❌ WhatsApp authentication failed:', msg);
});

client.on('disconnected', (reason) => {
    console.log('❌ WhatsApp disconnected:', reason);
    isWhatsAppReady = false;
});

// Initialize WhatsApp client
client.initialize().catch(err => {
    console.error('Failed to initialize WhatsApp client:', err);
});

// ============================================================================
// NOTIFICATION QUEUE SYSTEM
// ============================================================================

class NotificationQueue {
    constructor() {
        this.queue = [];
        this.processing = false;
        this.batchDelay = 60000; // 1 minute
        this.paused = false;
        this.pauseUntil = null;
    }

    add(notification) {
        // Check for duplicates
        const isDuplicate = this.queue.some(n =>
            n.taskId === notification.taskId &&
            n.type === notification.type &&
            Date.now() - n.timestamp < 60000 // Within last minute
        );

        if (!isDuplicate) {
            notification.timestamp = Date.now();
            this.queue.push(notification);
            console.log(`📬 Added to queue: ${notification.type} - ${notification.taskName}`);

            if (!this.processing) {
                this.startProcessing();
            }
        }
    }

    pause(minutes = 10) {
        this.paused = true;
        this.pauseUntil = Date.now() + (minutes * 60000);
        console.log(`⏸️ Notifications paused for ${minutes} minutes`);

        setTimeout(() => {
            this.resume();
        }, minutes * 60000);
    }

    resume() {
        this.paused = false;
        this.pauseUntil = null;
        console.log('▶️ Notifications resumed');

        if (this.queue.length > 0 && !this.processing) {
            this.startProcessing();
        }
    }

    async startProcessing() {
        if (this.processing || this.paused) return;

        this.processing = true;

        // Wait for batch delay
        await new Promise(resolve => setTimeout(resolve, this.batchDelay));

        if (this.paused) {
            this.processing = false;
            return;
        }

        // Process batch
        const batch = this.queue.splice(0, this.queue.length);

        if (batch.length > 0) {
            await this.sendBatchNotification(batch);
        }

        this.processing = false;

        // Continue if more items in queue
        if (this.queue.length > 0) {
            this.startProcessing();
        }
    }

    async sendBatchNotification(batch) {
        try {
            // Group notifications by type and parent task
            const grouped = this.groupNotifications(batch);

            let message = '📢 *ملخص التحديثات الأخيرة:*\n\n';
            message += '-------------------\n\n';

            // Assignments
            if (grouped.assignments.length > 0) {
                const byUser = {};
                grouped.assignments.forEach(notif => {
                    const userName = notif.assigneeName || 'مستخدم';
                    if (!byUser[userName]) byUser[userName] = [];
                    byUser[userName].push(notif);
                });

                for (const [userName, tasks] of Object.entries(byUser)) {
                    message += `✅ *تم إسناد ${tasks.length} مهام إلى ${userName}:*\n`;

                    // Group by parent
                    const byParent = {};
                    tasks.forEach(task => {
                        const parentId = task.parentTask || 'standalone';
                        if (!byParent[parentId]) byParent[parentId] = [];
                        byParent[parentId].push(task);
                    });

                    for (const [parentId, parentTasks] of Object.entries(byParent)) {
                        if (parentId !== 'standalone' && parentTasks.length > 0) {
                            message += `\n  *في المهمة: ${parentTasks[0].parentTaskName || 'مهمة رئيسية'}*\n`;
                        }

                        parentTasks.forEach(task => {
                            const shortUrl = await this.shortenUrl(task.taskUrl);
                            message += `  - ${task.taskName} 🔗 ${shortUrl}\n`;
                        });
                    }
                    message += '\n';
                }
            }

            // Completions
            if (grouped.completions.length > 0) {
                const byUser = {};
                grouped.completions.forEach(notif => {
                    const userName = notif.userName || 'مستخدم';
                    if (!byUser[userName]) byUser[userName] = [];
                    byUser[userName].push(notif);
                });

                for (const [userName, tasks] of Object.entries(byUser)) {
                    message += `🏆 *${userName} أنجز ${tasks.length} مهمة:*\n`;
                    for (const task of tasks) {
                        const shortUrl = await this.shortenUrl(task.taskUrl);
                        message += `  - ${task.taskName} 🔗 ${shortUrl}\n`;
                    }
                    message += '\n';
                }
            }

            // Status changes
            if (grouped.statusChanges.length > 0) {
                message += `📊 *تغييرات الحالة:*\n`;
                for (const change of grouped.statusChanges) {
                    const shortUrl = await this.shortenUrl(change.taskUrl);
                    message += `  - ${change.taskName}: ${change.oldStatus} ⬅️ ${change.newStatus} 🔗 ${shortUrl}\n`;
                }
                message += '\n';
            }

            // Comments
            if (grouped.comments.length > 0) {
                message += `💬 *تعليقات جديدة:*\n`;
                for (const comment of grouped.comments.slice(0, 5)) { // Limit to 5
                    const shortUrl = await this.shortenUrl(comment.taskUrl);
                    const commentText = comment.commentText.substring(0, 100);
                    message += `  - ${comment.taskName}: "${commentText}..." 🔗 ${shortUrl}\n`;
                }
                if (grouped.comments.length > 5) {
                    message += `  ... و ${grouped.comments.length - 5} تعليق آخر\n`;
                }
                message += '\n';
            }

            // Send to group
            if (groupChat && message.length > 50) {
                await sendToWhatsApp(groupChat.id._serialized, message);
                console.log(`✅ Batch notification sent (${batch.length} items)`);
            }

        } catch (error) {
            console.error('Error sending batch notification:', error);
        }
    }

    groupNotifications(batch) {
        const grouped = {
            assignments: [],
            completions: [],
            statusChanges: [],
            comments: []
        };

        batch.forEach(notif => {
            switch (notif.type) {
                case 'task_assigned':
                    grouped.assignments.push(notif);
                    break;
                case 'task_completed':
                    grouped.completions.push(notif);
                    break;
                case 'status_changed':
                    grouped.statusChanges.push(notif);
                    break;
                case 'comment_posted':
                    grouped.comments.push(notif);
                    break;
            }
        });

        return grouped;
    }

    async shortenUrl(longUrl) {
        try {
            const response = await axios.get(`http://tinyurl.com/api-create.php?url=${encodeURIComponent(longUrl)}`);
            return response.data;
        } catch (error) {
            return longUrl;
        }
    }
}

const notificationQueue = new NotificationQueue();

// ============================================================================
// WHATSAPP HELPER FUNCTIONS
// ============================================================================

async function sendToWhatsApp(to, message) {
    if (!isWhatsAppReady) {
        console.warn('⚠️ WhatsApp not ready yet');
        return false;
    }

    try {
        await client.sendMessage(to, message);
        console.log(`✅ Message sent to ${to}`);
        return true;
    } catch (error) {
        console.error(`❌ Failed to send message:`, error);
        return false;
    }
}

async function sendDirectMessage(userId, message) {
    const phone = USER_PHONE_MAP[userId];
    if (!phone) {
        console.warn(`No phone number mapped for user ${userId}`);
        return false;
    }

    const chatId = `${phone}@c.us`;
    return await sendToWhatsApp(chatId, message);
}

// ============================================================================
// CLICKUP API FUNCTIONS
// ============================================================================

async function getClickUpTask(taskId) {
    try {
        const response = await axios.get(
            `${CLICKUP_API_BASE}/task/${taskId}`,
            {
                headers: {
                    'Authorization': CLICKUP_TOKEN,
                    'Content-Type': 'application/json'
                }
            }
        );
        return response.data;
    } catch (error) {
        console.error(`Error fetching task ${taskId}:`, error.message);
        return null;
    }
}

async function getTeamTasks(listId = null) {
    try {
        let url = `${CLICKUP_API_BASE}/team/${CLICKUP_TEAM_ID}/task`;
        if (listId) {
            url = `${CLICKUP_API_BASE}/list/${listId}/task`;
        }

        const response = await axios.get(url, {
            headers: {
                'Authorization': CLICKUP_TOKEN
            },
            params: {
                include_closed: false
            }
        });

        return response.data.tasks || [];
    } catch (error) {
        console.error('Error fetching team tasks:', error.message);
        return [];
    }
}

async function getUserTasks(userId) {
    try {
        const response = await axios.get(
            `${CLICKUP_API_BASE}/team/${CLICKUP_TEAM_ID}/task`,
            {
                headers: {
                    'Authorization': CLICKUP_TOKEN
                },
                params: {
                    assignees: [userId],
                    include_closed: false
                }
            }
        );

        return response.data.tasks || [];
    } catch (error) {
        console.error(`Error fetching tasks for user ${userId}:`, error.message);
        return [];
    }
}

async function getCompletedTasksToday(userId) {
    try {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const response = await axios.get(
            `${CLICKUP_API_BASE}/team/${CLICKUP_TEAM_ID}/task`,
            {
                headers: {
                    'Authorization': CLICKUP_TOKEN
                },
                params: {
                    assignees: [userId],
                    statuses: ['complete', 'completed', 'closed'],
                    date_closed_gt: todayStart.getTime()
                }
            }
        );

        return response.data.tasks || [];
    } catch (error) {
        console.error(`Error fetching completed tasks:`, error.message);
        return [];
    }
}

// ============================================================================
// AI CONTENT GENERATION
// ============================================================================

async function generateAIContent(prompt, context = {}) {
    try {
        const systemPrompt = `أنت مساعد ذكي لفريق عمل مصري.
المهمة: إنشاء محتوى تحفيزي وإيجابي باللغة العربية.
السياق: ${JSON.stringify(context)}
الأسلوب: محفز، إيجابي، قصير، مباشر.`;

        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: 'gpt-4',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: prompt }
                ],
                max_tokens: 500,
                temperature: 0.8
            },
            {
                headers: {
                    'Authorization': `Bearer ${OPENAI_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        return response.data.choices[0].message.content;
    } catch (error) {
        console.error('Error generating AI content:', error.message);
        return null;
    }
}

function getCurrentSeason() {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'الربيع';
    if (month >= 5 && month <= 7) return 'الصيف';
    if (month >= 8 && month <= 10) return 'الخريف';
    return 'الشتاء';
}

function getTimeOfDay() {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'الصباح';
    if (hour >= 12 && hour < 17) return 'الظهر';
    if (hour >= 17 && hour < 21) return 'المساء';
    return 'الليل';
}

// ============================================================================
// SCHEDULED AI CONTENT
// ============================================================================

async function sendAIMorningInspiration() {
    try {
        console.log('🌅 Generating morning inspiration...');

        const context = {
            season: getCurrentSeason(),
            timeOfDay: getTimeOfDay(),
            location: 'القاهرة، مصر'
        };

        const prompt = `اكتب رسالة تحفيزية صباحية قصيرة (2-3 جمل) لفريق عمل مصري.
الرسالة يجب أن تكون:
- إيجابية ومحفزة
- مناسبة للوقت الحالي (${context.timeOfDay})
- مناسبة للفصل (${context.season})
- تشجع على الإنتاجية والعمل الجماعي`;

        const content = await generateAIContent(prompt, context);

        if (content && groupChat) {
            const message = `🌅 *صباح الخير*\n\n${content}`;
            await sendToWhatsApp(groupChat.id._serialized, message);
            console.log('✅ Morning inspiration sent');
        }
    } catch (error) {
        console.error('Error sending morning inspiration:', error);
    }
}

async function sendDailyUserTasks() {
    try {
        console.log('📊 Sending daily user tasks...');

        for (const [userId, phone] of Object.entries(USER_PHONE_MAP)) {
            if (!phone) continue;

            const userName = USER_NAME_MAP[userId];
            const openTasks = await getUserTasks(userId);
            const completedToday = await getCompletedTasksToday(userId);

            // Calculate overdue tasks
            const now = Date.now();
            const overdueTasks = openTasks.filter(task =>
                task.due_date && parseInt(task.due_date) < now
            );

            // Calculate due today
            const todayEnd = new Date();
            todayEnd.setHours(23, 59, 59, 999);
            const dueToday = openTasks.filter(task =>
                task.due_date &&
                parseInt(task.due_date) >= now &&
                parseInt(task.due_date) <= todayEnd.getTime()
            );

            // Calculate completion rate
            const totalClosed = completedToday.length;
            const totalTasks = openTasks.length + totalClosed;
            const completionRate = totalTasks > 0 ? Math.round((totalClosed / totalTasks) * 100) : 0;

            // Progress bar
            const progressBarLength = 20;
            const filledLength = Math.round((completionRate / 100) * progressBarLength);
            const progressBar = '█'.repeat(filledLength) + '░'.repeat(progressBarLength - filledLength);

            let message = `🌅 *ملخص مهامك لليوم*\n@${userName}\n\n`;
            message += `🎯 الإجمالي المفتوح: ${openTasks.length}\n`;
            message += `✅ مكتملة اليوم: ${completedToday.length}\n`;
            message += `⚠️ متأخرة: ${overdueTasks.length}\n\n`;
            message += `📈 نسبة إنجاز اليوم: ${completionRate}%\n`;
            message += `[${progressBar}]\n\n`;

            if (dueToday.length > 0) {
                message += `🗓️ *مهام تستحق اليوم:*\n`;
                for (const task of dueToday.slice(0, 5)) {
                    const shortUrl = await notificationQueue.shortenUrl(task.url);
                    message += `  - ${task.name} 🔗 ${shortUrl}\n`;
                }
                if (dueToday.length > 5) {
                    message += `  ... و ${dueToday.length - 5} مهام أخرى\n`;
                }
                message += '\n';
            }

            if (overdueTasks.length > 0) {
                message += `⚠️ *مهام متأخرة:*\n`;
                for (const task of overdueTasks.slice(0, 5)) {
                    const shortUrl = await notificationQueue.shortenUrl(task.url);
                    message += `  - ${task.name} 🔗 ${shortUrl}\n`;
                }
                if (overdueTasks.length > 5) {
                    message += `  ... و ${overdueTasks.length - 5} مهام أخرى\n`;
                }
            }

            await sendDirectMessage(userId, message);
        }

        console.log('✅ Daily user tasks sent');
    } catch (error) {
        console.error('Error sending daily user tasks:', error);
    }
}

async function sendDailyGroupStats() {
    try {
        console.log('📊 Generating daily group stats...');

        let message = '📊 *إحصائيات الإنجاز اليومية*\n\n';

        for (const [userId, phone] of Object.entries(USER_PHONE_MAP)) {
            if (!phone) continue;

            const userName = USER_NAME_MAP[userId];
            const openTasks = await getUserTasks(userId);
            const completedToday = await getCompletedTasksToday(userId);

            message += `@${userName}\n`;
            message += `✅ مكتملة اليوم: ${completedToday.length}\n`;
            message += `📌 مفتوحة: ${openTasks.length}\n`;
            message += `📦 الإجمالي المكتمل: ${completedToday.length}\n\n`;
        }

        // Find top performer
        let maxCompleted = 0;
        let topPerformer = '';
        for (const [userId, phone] of Object.entries(USER_PHONE_MAP)) {
            if (!phone) continue;
            const completed = await getCompletedTasksToday(userId);
            if (completed.length > maxCompleted) {
                maxCompleted = completed.length;
                topPerformer = USER_NAME_MAP[userId];
            }
        }

        if (topPerformer && maxCompleted > 0) {
            message += `\n🎖️ *Top Performer*: @${topPerformer} (${maxCompleted} مهام)`;
        }

        if (groupChat) {
            await sendToWhatsApp(groupChat.id._serialized, message);
            console.log('✅ Daily group stats sent');
        }
    } catch (error) {
        console.error('Error sending daily group stats:', error);
    }
}

async function sendInspirationalContent() {
    try {
        console.log('✨ Sending inspirational content...');

        // Try to read from prompts file
        let promptsContent = '';
        try {
            promptsContent = await fs.readFile(path.join(__dirname, '../config/prompts.txt'), 'utf-8');
        } catch (err) {
            console.log('No prompts file found, using default');
        }

        const prompt = promptsContent || `اكتب محتوى ملهم قصير (3-4 جمل) يحفز فريق العمل على:
- الإنتاجية
- التعاون
- التفاؤل
- التحسين المستمر`;

        const content = await generateAIContent(prompt);

        if (content && groupChat) {
            const message = `✨ *لحظة إلهام*\n\n${content}`;
            await sendToWhatsApp(groupChat.id._serialized, message);
            console.log('✅ Inspirational content sent');
        }
    } catch (error) {
        console.error('Error sending inspirational content:', error);
    }
}

async function sendWeeklyReport() {
    try {
        console.log('📅 Generating weekly report...');

        const prompt = `اكتب تقرير أسبوعي ملهم لفريق عمل.
يجب أن يتضمن:
- تهنئة على إنجازات الأسبوع
- تشجيع على الأسبوع القادم
- نصيحة للتحسين المستمر
- أسلوب إيجابي ومحفز`;

        const content = await generateAIContent(prompt);

        if (content && groupChat) {
            let message = `📅 *تقرير الأسبوع*\n\n`;
            message += content;
            message += '\n\n---\n';
            message += 'أسبوع موفق للجميع! 🎯';

            await sendToWhatsApp(groupChat.id._serialized, message);
            console.log('✅ Weekly report sent');
        }
    } catch (error) {
        console.error('Error sending weekly report:', error);
    }
}

async function sendAIGroupHighlights() {
    try {
        console.log('🌟 Generating AI group highlights...');

        const prompt = `اكتب رسالة قصيرة (2-3 جمل) تلخص أبرز إنجازات اليوم وتشجع الفريق.
الأسلوب: إيجابي، محفز، شكر وتقدير`;

        const content = await generateAIContent(prompt);

        if (content && groupChat) {
            const message = `🌟 *أبرز إنجازات اليوم*\n\n${content}`;
            await sendToWhatsApp(groupChat.id._serialized, message);
            console.log('✅ AI group highlights sent');
        }
    } catch (error) {
        console.error('Error sending AI group highlights:', error);
    }
}

async function sendAIGroupGoodnight() {
    try {
        console.log('🌙 Sending goodnight message...');

        const prompt = `اكتب رسالة مسائية قصيرة (2-3 جمل) تشكر الفريق على مجهودهم وتتمنى لهم ليلة سعيدة.
الأسلوب: دافئ، ممتن، إيجابي`;

        const content = await generateAIContent(prompt);

        if (content && groupChat) {
            const message = `🌙 *تصبحون على خير*\n\n${content}`;
            await sendToWhatsApp(groupChat.id._serialized, message);
            console.log('✅ Goodnight message sent');
        }
    } catch (error) {
        console.error('Error sending goodnight message:', error);
    }
}

// ============================================================================
// CLICKUP WEBHOOK HANDLERS
// ============================================================================

app.post('/task-created-webhook', async (req, res) => {
    try {
        const data = req.body;
        console.log('📝 Task created webhook received');

        const taskId = data.task_id;
        const task = await getClickUpTask(taskId);

        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }

        const taskName = task.name;
        const taskUrl = task.url;
        const assignees = task.assignees || [];

        // Send direct notification to each assignee
        for (const assignee of assignees) {
            const userId = assignee.id.toString();
            const userName = assignee.username || USER_NAME_MAP[userId] || 'User';

            let message = `📝 *مهمة جديدة تم إسنادها لك*\n\n`;
            message += `المهمة: ${taskName}\n`;

            if (task.parent) {
                const parentTask = await getClickUpTask(task.parent);
                if (parentTask) {
                    message += `المهمة الرئيسية: ${parentTask.name}\n`;
                }
            }

            const shortUrl = await notificationQueue.shortenUrl(taskUrl);
            message += `\n🔗 ${shortUrl}\n\n`;
            message += `@${userName}`;

            await sendDirectMessage(userId, message);
        }

        // Add to queue for group notification
        for (const assignee of assignees) {
            notificationQueue.add({
                type: 'task_assigned',
                taskId: taskId,
                taskName: taskName,
                taskUrl: taskUrl,
                assigneeId: assignee.id.toString(),
                assigneeName: assignee.username || USER_NAME_MAP[assignee.id.toString()],
                parentTask: task.parent,
                parentTaskName: task.parent ? (await getClickUpTask(task.parent))?.name : null
            });
        }

        res.status(200).json({ message: 'Task created notification processed' });
    } catch (error) {
        console.error('Error handling task created webhook:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/task-updated-webhook', async (req, res) => {
    try {
        const data = req.body;
        console.log('📝 Task updated webhook received');

        const taskId = data.task_id;
        const task = await getClickUpTask(taskId);

        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }

        // Check what was updated
        const historyItems = data.history_items || [];

        for (const item of historyItems) {
            if (item.field === 'status') {
                // Status changed
                const oldStatus = item.before?.status || 'Unknown';
                const newStatus = item.after?.status || 'Unknown';

                // Check if completed
                if (newStatus.toLowerCase() === 'complete' || newStatus.toLowerCase() === 'closed') {
                    const user = item.user || {};
                    const userName = user.username || 'User';

                    notificationQueue.add({
                        type: 'task_completed',
                        taskId: taskId,
                        taskName: task.name,
                        taskUrl: task.url,
                        userName: userName
                    });
                } else {
                    notificationQueue.add({
                        type: 'status_changed',
                        taskId: taskId,
                        taskName: task.name,
                        taskUrl: task.url,
                        oldStatus: oldStatus,
                        newStatus: newStatus
                    });
                }
            }
        }

        res.status(200).json({ message: 'Task updated notification processed' });
    } catch (error) {
        console.error('Error handling task updated webhook:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/task-comment-webhook', async (req, res) => {
    try {
        const data = req.body;
        console.log('💬 Task comment webhook received');

        const taskId = data.task_id;
        const comment = data.comment || {};

        const task = await getClickUpTask(taskId);
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }

        const commentText = comment.text_content || comment.comment_text || '';
        const commentUser = comment.user?.username || 'User';

        notificationQueue.add({
            type: 'comment_posted',
            taskId: taskId,
            taskName: task.name,
            taskUrl: task.url,
            commentText: commentText,
            commentUser: commentUser
        });

        res.status(200).json({ message: 'Comment notification processed' });
    } catch (error) {
        console.error('Error handling comment webhook:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================================================
// WHATSAPP MESSAGE SEND ENDPOINT
// ============================================================================

app.post('/send', async (req, res) => {
    try {
        const { to, message } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        const targetTo = to || (groupChat ? groupChat.id._serialized : null);

        if (!targetTo) {
            return res.status(400).json({ error: 'No recipient specified and no group found' });
        }

        const success = await sendToWhatsApp(targetTo, message);

        if (success) {
            res.status(200).json({ message: 'Sent successfully' });
        } else {
            res.status(500).json({ error: 'Failed to send message' });
        }
    } catch (error) {
        console.error('Error in /send endpoint:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================================================
// PAUSE NOTIFICATIONS ENDPOINT
// ============================================================================

app.post('/pause-notifications', (req, res) => {
    try {
        const { minutes = 10 } = req.body;
        notificationQueue.pause(minutes);
        res.status(200).json({ message: `Notifications paused for ${minutes} minutes` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================================================
// HEALTH CHECK
// ============================================================================

app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        whatsapp: isWhatsAppReady ? 'connected' : 'disconnected',
        queue: notificationQueue.queue.length,
        paused: notificationQueue.paused,
        timestamp: new Date().toISOString()
    });
});

// ============================================================================
// CRON JOBS SETUP
// ============================================================================

function setupCronJobs() {
    console.log('⏰ Setting up cron jobs...');

    // Morning inspiration at 8:05 AM
    cron.schedule('5 8 * * *', sendAIMorningInspiration, {
        timezone: 'Africa/Cairo'
    });

    // Daily user tasks at 8:30 AM
    cron.schedule('30 8 * * *', sendDailyUserTasks, {
        timezone: 'Africa/Cairo'
    });

    // Inspirational content at 9:15 AM
    cron.schedule('15 9 * * *', sendInspirationalContent, {
        timezone: 'Africa/Cairo'
    });

    // Evening highlights at 11:50 PM
    cron.schedule('50 23 * * *', sendAIGroupHighlights, {
        timezone: 'Africa/Cairo'
    });

    // Daily group stats at 11:55 PM
    cron.schedule('55 23 * * *', sendDailyGroupStats, {
        timezone: 'Africa/Cairo'
    });

    // Goodnight message at 11:58 PM
    cron.schedule('58 23 * * *', sendAIGroupGoodnight, {
        timezone: 'Africa/Cairo'
    });

    // Daily user tasks (evening) at 11:45 PM
    cron.schedule('45 23 * * *', sendDailyUserTasks, {
        timezone: 'Africa/Cairo'
    });

    // Weekly report on Friday at 9:00 AM
    cron.schedule('0 9 * * 5', sendWeeklyReport, {
        timezone: 'Africa/Cairo'
    });

    console.log('✅ Cron jobs scheduled');
}

// ============================================================================
// START SERVER
// ============================================================================

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 Endpoints:`);
    console.log(`   POST /task-created-webhook`);
    console.log(`   POST /task-updated-webhook`);
    console.log(`   POST /task-comment-webhook`);
    console.log(`   POST /send`);
    console.log(`   POST /pause-notifications`);
    console.log(`   GET  /health`);

    // Setup cron jobs
    setupCronJobs();
});

// ============================================================================
// GRACEFUL SHUTDOWN
// ============================================================================

process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down gracefully...');
    if (client) {
        await client.destroy();
    }
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n🛑 Shutting down gracefully...');
    if (client) {
        await client.destroy();
    }
    process.exit(0);
});
