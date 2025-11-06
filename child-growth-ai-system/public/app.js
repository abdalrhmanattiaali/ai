// API Base URL
const API_URL = '';

// Show alert
function showAlert(message, type = 'success') {
    const alertContainer = document.getElementById('alertContainer');
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    alertContainer.appendChild(alert);

    setTimeout(() => {
        alert.remove();
    }, 5000);
}

// Show tab
function showTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });

    // Remove active class from all tab buttons
    document.querySelectorAll('.tab').forEach(btn => {
        btn.classList.remove('active');
    });

    // Show selected tab
    document.getElementById(tabName).classList.add('active');

    // Add active class to clicked button
    event.target.classList.add('active');

    // Load data for the tab
    loadTabData(tabName);
}

// Load tab data
function loadTabData(tabName) {
    switch(tabName) {
        case 'setup':
            loadChildInfo();
            loadParentInfo();
            break;
        case 'dashboard':
            loadStats();
            loadWeather();
            break;
        case 'schedules':
            loadSchedules();
            break;
        case 'activities':
            loadActivities();
            break;
        case 'memory':
            loadMemory();
            break;
    }
}

// Check WhatsApp status
async function checkWhatsAppStatus() {
    try {
        const response = await fetch(`${API_URL}/api/whatsapp/status`);
        const data = await response.json();

        const statusElement = document.getElementById('whatsappStatus');
        const indicatorElement = document.getElementById('whatsappIndicator');

        if (data.connected) {
            statusElement.textContent = 'متصل';
            indicatorElement.classList.add('connected');
            indicatorElement.classList.remove('disconnected');
        } else {
            statusElement.textContent = 'غير متصل';
            indicatorElement.classList.add('disconnected');
            indicatorElement.classList.remove('connected');
        }
    } catch (error) {
        console.error('Error checking WhatsApp status:', error);
    }
}

// Load statistics
async function loadStats() {
    try {
        const response = await fetch(`${API_URL}/api/stats`);
        const result = await response.json();

        if (result.success) {
            const stats = result.data;
            document.getElementById('totalMessages').textContent = stats.totalMessages;
            document.getElementById('completedActivities').textContent = stats.completedActivities;
            document.getElementById('statMessages').textContent = stats.totalMessages;
            document.getElementById('statInteractions').textContent = stats.totalInteractions;
            document.getElementById('statActivities').textContent = stats.totalActivities;
            document.getElementById('statCompleted').textContent = stats.completedActivities;
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Load weather
async function loadWeather() {
    try {
        const response = await fetch(`${API_URL}/api/weather`);
        const result = await response.json();

        if (result.success) {
            const weather = result.data;
            const weatherHTML = `
                <div style="text-align: center;">
                    <h3 style="font-size: 3rem; margin-bottom: 10px;">${weather.temp}°C</h3>
                    <p style="font-size: 1.3rem; color: #667eea; margin-bottom: 15px;">${weather.description}</p>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-top: 20px;">
                        <div>
                            <p style="color: #666;">الإحساس بـ</p>
                            <p style="font-size: 1.5rem; font-weight: bold; color: #667eea;">${weather.feelsLike}°C</p>
                        </div>
                        <div>
                            <p style="color: #666;">الرطوبة</p>
                            <p style="font-size: 1.5rem; font-weight: bold; color: #667eea;">${weather.humidity}%</p>
                        </div>
                        <div>
                            <p style="color: #666;">سرعة الرياح</p>
                            <p style="font-size: 1.5rem; font-weight: bold; color: #667eea;">${weather.windSpeed} كم/س</p>
                        </div>
                    </div>
                </div>
            `;
            document.getElementById('weatherInfo').innerHTML = weatherHTML;
        }
    } catch (error) {
        console.error('Error loading weather:', error);
        document.getElementById('weatherInfo').innerHTML = '<p class="empty-state">فشل تحميل بيانات الطقس</p>';
    }
}

// Load child info
async function loadChildInfo() {
    try {
        const response = await fetch(`${API_URL}/api/child`);
        const result = await response.json();

        if (result.success && result.data) {
            const child = result.data;
            document.getElementById('childName').value = child.name || '';
            document.getElementById('childNickname').value = child.nickname || '';
            document.getElementById('childBirthDate').value = child.birth_date || '';
            document.getElementById('childGender').value = child.gender || '';
            document.getElementById('childWeight').value = child.weight || '';
            document.getElementById('childHeight').value = child.height || '';
        }
    } catch (error) {
        console.error('Error loading child info:', error);
    }
}

// Load parent info
async function loadParentInfo() {
    try {
        // Load father
        const fatherResponse = await fetch(`${API_URL}/api/parent/father`);
        const fatherResult = await fatherResponse.json();

        if (fatherResult.success && fatherResult.data) {
            const father = fatherResult.data;
            const fatherForm = document.getElementById('fatherForm');
            fatherForm.querySelector('[name="name"]').value = father.name || '';
            fatherForm.querySelector('[name="phone"]').value = father.phone || '';
            fatherForm.querySelector('[name="education_level"]').value = father.education_level || '';
            fatherForm.querySelector('[name="interests"]').value = father.interests || '';
        }

        // Load mother
        const motherResponse = await fetch(`${API_URL}/api/parent/mother`);
        const motherResult = await motherResponse.json();

        if (motherResult.success && motherResult.data) {
            const mother = motherResult.data;
            const motherForm = document.getElementById('motherForm');
            motherForm.querySelector('[name="name"]').value = mother.name || '';
            motherForm.querySelector('[name="phone"]').value = mother.phone || '';
            motherForm.querySelector('[name="education_level"]').value = mother.education_level || '';
            motherForm.querySelector('[name="interests"]').value = mother.interests || '';
        }
    } catch (error) {
        console.error('Error loading parent info:', error);
    }
}

// Load schedules
async function loadSchedules() {
    try {
        const response = await fetch(`${API_URL}/api/schedules`);
        const result = await response.json();

        if (result.success) {
            const schedules = result.data;
            const schedulesList = document.getElementById('schedulesList');

            if (schedules.length === 0) {
                schedulesList.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📅</div><p>لا توجد جدولات</p></div>';
                return;
            }

            let html = '<div class="grid">';
            schedules.forEach(schedule => {
                const typeNames = {
                    'morning': 'صباحي',
                    'noon': 'ظهري',
                    'evening': 'مسائي',
                    'night': 'ليلي'
                };

                const targetNames = {
                    'both': 'الأب والأم',
                    'father': 'الأب',
                    'mother': 'الأم'
                };

                html += `
                    <div class="schedule-item">
                        <h4>${typeNames[schedule.schedule_type] || schedule.schedule_type}</h4>
                        <p><strong>الوقت:</strong> ${schedule.time}</p>
                        <p><strong>المستقبل:</strong> ${targetNames[schedule.target]}</p>
                        <p><strong>الحالة:</strong> ${schedule.enabled ? '<span class="badge badge-success">مفعل</span>' : '<span class="badge badge-warning">معطل</span>'}</p>
                        ${schedule.last_sent ? `<p style="font-size: 0.85rem; color: #999;">آخر إرسال: ${new Date(schedule.last_sent).toLocaleString('ar-EG')}</p>` : ''}
                        <div class="action-buttons">
                            <button class="btn btn-small ${schedule.enabled ? 'btn-danger' : 'btn-secondary'}" onclick="toggleSchedule(${schedule.id}, ${!schedule.enabled})">
                                ${schedule.enabled ? 'تعطيل' : 'تفعيل'}
                            </button>
                        </div>
                    </div>
                `;
            });
            html += '</div>';

            schedulesList.innerHTML = html;
        }
    } catch (error) {
        console.error('Error loading schedules:', error);
        document.getElementById('schedulesList').innerHTML = '<p class="empty-state">فشل تحميل الجدولات</p>';
    }
}

// Toggle schedule
async function toggleSchedule(id, enabled) {
    try {
        const response = await fetch(`${API_URL}/api/schedules/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ enabled })
        });

        const result = await response.json();

        if (result.success) {
            showAlert(result.message);
            loadSchedules();
        } else {
            showAlert(result.error || 'حدث خطأ', 'error');
        }
    } catch (error) {
        console.error('Error toggling schedule:', error);
        showAlert('حدث خطأ في تحديث الجدولة', 'error');
    }
}

// Load activities
async function loadActivities() {
    try {
        const response = await fetch(`${API_URL}/api/activities`);
        const result = await response.json();

        if (result.success) {
            const activities = result.data;
            const activitiesList = document.getElementById('activitiesList');

            if (activities.length === 0) {
                activitiesList.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🎯</div><p>لا توجد أنشطة</p></div>';
                return;
            }

            let html = '<div class="grid">';
            activities.forEach(activity => {
                const statusBadges = {
                    'suggested': '<span class="badge badge-info">مقترح</span>',
                    'completed': '<span class="badge badge-success">مكتمل</span>',
                    'skipped': '<span class="badge badge-warning">تم تخطيه</span>'
                };

                html += `
                    <div class="activity-item">
                        <h4>${activity.title}</h4>
                        <p>${activity.description || ''}</p>
                        <p><strong>النوع:</strong> ${activity.activity_type}</p>
                        <p><strong>الحالة:</strong> ${statusBadges[activity.status]}</p>
                        ${activity.status === 'suggested' ? `
                            <div class="action-buttons">
                                <button class="btn btn-small btn-secondary" onclick="updateActivityStatus(${activity.id}, 'completed')">✅ تم</button>
                                <button class="btn btn-small btn-danger" onclick="updateActivityStatus(${activity.id}, 'skipped')">⏭️ تخطي</button>
                            </div>
                        ` : ''}
                    </div>
                `;
            });
            html += '</div>';

            activitiesList.innerHTML = html;
        }
    } catch (error) {
        console.error('Error loading activities:', error);
        document.getElementById('activitiesList').innerHTML = '<p class="empty-state">فشل تحميل الأنشطة</p>';
    }
}

// Update activity status
async function updateActivityStatus(id, status) {
    try {
        const response = await fetch(`${API_URL}/api/activities/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status })
        });

        const result = await response.json();

        if (result.success) {
            showAlert(result.message);
            loadActivities();
            loadStats();
        } else {
            showAlert(result.error || 'حدث خطأ', 'error');
        }
    } catch (error) {
        console.error('Error updating activity:', error);
        showAlert('حدث خطأ في تحديث النشاط', 'error');
    }
}

// Load memory
async function loadMemory() {
    try {
        const response = await fetch(`${API_URL}/api/memory?limit=30`);
        const result = await response.json();

        if (result.success) {
            const memory = result.data;
            const memoryList = document.getElementById('memoryList');

            if (memory.length === 0) {
                memoryList.innerHTML = '<div class="empty-state"><div class="empty-state-icon">💭</div><p>لا توجد ذاكرة محادثات</p></div>';
                return;
            }

            let html = '<div class="grid">';
            memory.forEach(item => {
                const parentName = item.parent_type === 'father' ? 'الأب' : 'الأم';
                const messageType = item.message_type === 'sent' ? 'مُرسل' : 'مُستقبل';

                html += `
                    <div class="memory-item">
                        <h4>${parentName} - ${messageType}</h4>
                        <p>${item.content}</p>
                        <p style="font-size: 0.85rem; color: #999; margin-top: 10px;">
                            ${new Date(item.timestamp).toLocaleString('ar-EG')}
                        </p>
                    </div>
                `;
            });
            html += '</div>';

            memoryList.innerHTML = html;
        }
    } catch (error) {
        console.error('Error loading memory:', error);
        document.getElementById('memoryList').innerHTML = '<p class="empty-state">فشل تحميل الذاكرة</p>';
    }
}

// Send immediate message
async function sendImmediateMessage() {
    const messageType = document.getElementById('messageType').value;
    const target = document.getElementById('messageTarget').value;

    try {
        const response = await fetch(`${API_URL}/api/whatsapp/send`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ messageType, target })
        });

        const result = await response.json();

        if (result.success) {
            showAlert('تم إرسال الرسالة بنجاح! ✅');
        } else {
            showAlert(result.error || 'فشل إرسال الرسالة', 'error');
        }
    } catch (error) {
        console.error('Error sending message:', error);
        showAlert('حدث خطأ في إرسال الرسالة', 'error');
    }
}

// Get AI recommendation
async function getAIRecommendation(type) {
    const aiResults = document.getElementById('aiResults');
    aiResults.innerHTML = '<div class="loading">جاري توليد التوصيات...</div>';

    try {
        const childResponse = await fetch(`${API_URL}/api/child`);
        const childResult = await childResponse.json();

        if (!childResult.success || !childResult.data) {
            aiResults.innerHTML = '<div class="alert alert-error">يرجى إضافة معلومات الطفل أولاً</div>';
            return;
        }

        const child = childResult.data;
        const birthDate = new Date(child.birth_date);
        const today = new Date();
        const ageInYears = today.getFullYear() - birthDate.getFullYear();

        let params = {};

        switch(type) {
            case 'books':
                params = { type: 'books', age: ageInYears, interests: '' };
                break;
            case 'courses':
                params = { type: 'courses', audience: 'الوالدين', topic: 'التربية وتطوير الأطفال' };
                break;
            case 'exercises':
                params = { type: 'exercises', age: ageInYears };
                break;
            case 'outings':
                params = { type: 'outings', age: ageInYears, city: 'القاهرة', season: getCurrentSeason() };
                break;
        }

        const response = await fetch(`${API_URL}/api/ai/recommend`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(params)
        });

        const result = await response.json();

        if (result.success) {
            aiResults.innerHTML = `
                <div class="card" style="background: #f9fafb;">
                    <h3 style="color: #667eea; margin-bottom: 15px;">النتيجة:</h3>
                    <div style="white-space: pre-wrap; line-height: 1.8;">${result.data}</div>
                </div>
            `;
        } else {
            aiResults.innerHTML = `<div class="alert alert-error">${result.error || 'فشل في توليد التوصيات'}</div>`;
        }
    } catch (error) {
        console.error('Error getting AI recommendation:', error);
        aiResults.innerHTML = '<div class="alert alert-error">حدث خطأ في توليد التوصيات</div>';
    }
}

function getCurrentSeason() {
    const month = new Date().getMonth() + 1;
    if (month >= 3 && month <= 5) return 'الربيع';
    if (month >= 6 && month <= 8) return 'الصيف';
    if (month >= 9 && month <= 11) return 'الخريف';
    return 'الشتاء';
}

// Form submissions
document.getElementById('childForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    try {
        const response = await fetch(`${API_URL}/api/child`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (result.success) {
            showAlert(result.message);
        } else {
            showAlert(result.error || 'حدث خطأ', 'error');
        }
    } catch (error) {
        console.error('Error saving child info:', error);
        showAlert('حدث خطأ في حفظ البيانات', 'error');
    }
});

document.getElementById('fatherForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    try {
        const response = await fetch(`${API_URL}/api/parent`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (result.success) {
            showAlert(result.message);
        } else {
            showAlert(result.error || 'حدث خطأ', 'error');
        }
    } catch (error) {
        console.error('Error saving father info:', error);
        showAlert('حدث خطأ في حفظ البيانات', 'error');
    }
});

document.getElementById('motherForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    try {
        const response = await fetch(`${API_URL}/api/parent`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (result.success) {
            showAlert(result.message);
        } else {
            showAlert(result.error || 'حدث خطأ', 'error');
        }
    } catch (error) {
        console.error('Error saving mother info:', error);
        showAlert('حدث خطأ في حفظ البيانات', 'error');
    }
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    checkWhatsAppStatus();
    loadChildInfo();
    loadParentInfo();
    loadStats();

    // Check WhatsApp status every 30 seconds
    setInterval(checkWhatsAppStatus, 30000);

    // Reload stats every minute
    setInterval(loadStats, 60000);
});
