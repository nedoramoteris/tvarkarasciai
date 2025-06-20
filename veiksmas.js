document.addEventListener('DOMContentLoaded', function() {
    // Dark mode toggle
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    darkModeToggle.addEventListener('click', function() {
        document.body.classList.toggle('dark-mode');
        const isDarkMode = document.body.classList.contains('dark-mode');
        localStorage.setItem('darkMode', isDarkMode);
    });
    
    // Check for saved dark mode preference
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
    }
    
    // Activities array to store all activities
    let activities = [];
    
    // Add activity button
    const addActivityBtn = document.getElementById('add-activity');
    addActivityBtn.addEventListener('click', addActivity);
    
    // Generate calendar button
    const generateCalendarBtn = document.getElementById('generate-calendar');
    generateCalendarBtn.addEventListener('click', generateCalendar);
    
    // Download calendar button
    const downloadCalendarBtn = document.getElementById('download-calendar');
    downloadCalendarBtn.addEventListener('click', downloadCalendarAsPNG);
    
    // Function to add activity
    function addActivity() {
        const day = document.getElementById('activity-day').value;
        const startTime = document.getElementById('start-time').value;
        const endTime = document.getElementById('end-time').value;
        const name = document.getElementById('activity-name').value.trim();
        const desc = document.getElementById('activity-desc').value.trim();
        const availability = document.getElementById('availability').value;
        
        if (!name || !startTime || !endTime) {
            alert('Please fill in all required fields');
            return;
        }
        
        const activity = {
            day,
            startTime,
            endTime,
            name,
            desc,
            availability,
            id: Date.now()
        };
        
        activities.push(activity);
        updateActivitiesList();
        clearForm();
    }
    
    // Function to update activities list
    function updateActivitiesList() {
        const activitiesList = document.getElementById('activities-list');
        activitiesList.innerHTML = '';
        
        if (activities.length === 0) {
            activitiesList.innerHTML = '<p style="color: #6E6761; font-size: 12px; text-align: center;">Veiklų nėra</p>';
            return;
        }
        
        activities.forEach(activity => {
            const activityItem = document.createElement('div');
            activityItem.className = `activity-item activity-${activity.availability}`;
            activityItem.dataset.id = activity.id;
            
            activityItem.innerHTML = `
                <div class="activity-details">
                    <div class="activity-day">${activity.day}</div>
                    <div class="activity-time">${formatTime(activity.startTime)} - ${formatTime(activity.endTime)}</div>
                    <div class="activity-name">${activity.name}</div>
                    ${activity.desc ? `<div class="activity-description">${activity.desc}</div>` : ''}
                    <div class="activity-availability">${formatAvailability(activity.availability)}</div>
                </div>
                <button class="remove-activity" data-id="${activity.id}">×</button>
            `;
            
            activitiesList.appendChild(activityItem);
        });
        
        document.querySelectorAll('.remove-activity').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = parseInt(this.dataset.id);
                activities = activities.filter(activity => activity.id !== id);
                updateActivitiesList();
            });
        });
    }
    
    // Function to format availability text
    function formatAvailability(availability) {
        const availabilityText = {
            'available': '<div class="availability-badge-available">atrašo į žinutes</div>',
            'somewhat': '<div class="availability-badge-somewhat-unavailable">kartais atrašo į žinutes</div>',
            'unavailable': '<div class="availability-badge-unavailable">susisiekti neįmanoma</div>'
        };
        return availabilityText[availability] || '';
    }
    
    // Function to clear form
    function clearForm() {
        document.getElementById('activity-name').value = '';
        document.getElementById('activity-desc').value = '';
        document.getElementById('start-time').value = '';
        document.getElementById('end-time').value = '';
        document.getElementById('availability').value = 'available';
    }
    
    // Function to format time (HH:MM to H:MM AM/PM)
    function formatTime(timeString) {
        if (!timeString) return '';
        
        const [hours, minutes] = timeString.split(':');
        let hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        hour = hour % 12;
        hour = hour ? hour : 12; // Convert 0 to 12
        return `${hour}:${minutes} ${ampm}`;
    }
    
    // Function to generate calendar
    function generateCalendar() {
        document.querySelectorAll('.calendar-day').forEach(dayElement => {
            const dayHeader = dayElement.querySelector('.day-header');
            dayElement.innerHTML = '';
            dayElement.appendChild(dayHeader);
        });
        
        if (activities.length === 0) {
            alert('No activities to display. Please add some activities first.');
            return;
        }
        
        const sortedActivities = [...activities].sort((a, b) => {
            return a.startTime.localeCompare(b.startTime);
        });
        
        const activitiesByDay = {
            'Pirmadienis': [],
            'Antradienis': [],
            'Trečiadienis': [],
            'Ketvirtadienis': [],
            'Penktadienis': [],
            'Šeštadienis': [],
            'Sekmadienis': []
        };
        
        sortedActivities.forEach(activity => {
            activitiesByDay[activity.day].push(activity);
        });
        
        for (const day in activitiesByDay) {
            const dayActivities = activitiesByDay[day];
            const dayElement = Array.from(document.querySelectorAll('.calendar-day'))
                .find(el => el.querySelector('.day-header').textContent === day);
            
            dayActivities.forEach(activity => {
                const activityElement = document.createElement('div');
                activityElement.className = `calendar-activity activity-${activity.availability}`;
                activityElement.innerHTML = `
                    <div class="activity-time-display">${formatTime(activity.startTime)} - ${formatTime(activity.endTime)}</div>
                    <div class="activity-name-display">${activity.name}</div>
                    ${activity.desc ? `<div class="activity-desc-display" style="margin-top: 3px; font-size: 10px;">${activity.desc}</div>` : ''}
                    <div class="availability-badge">${formatAvailability(activity.availability)}</div>
                `;
                dayElement.appendChild(activityElement);
            });
        }
    }
    
    // Function to download calendar as PNG
    function downloadCalendarAsPNG() {
        const calendarSection = document.querySelector('.calendar-section');
        const actionButtons = document.querySelector('.calendar-actions');
        
        if (!activities.length) {
            alert('Please generate your calendar first before downloading.');
            return;
        }
        
        const originalText = downloadCalendarBtn.textContent;
        downloadCalendarBtn.textContent = 'Generating...';
        downloadCalendarBtn.disabled = true;
        
        // Hide buttons for export
        actionButtons.classList.add('hidden-for-export');
        
        html2canvas(calendarSection, {
            scale: 2,
            backgroundColor: document.body.classList.contains('dark-mode') ? '#f5f5f5' : '#292725',
            logging: false,
            useCORS: true,
            allowTaint: true
        }).then(canvas => {
            const link = document.createElement('a');
            link.download = 'weekly-schedule.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
            
            // Show buttons again
            actionButtons.classList.remove('hidden-for-export');
            downloadCalendarBtn.textContent = originalText;
            downloadCalendarBtn.disabled = false;
        }).catch(err => {
            console.error('Error generating PNG:', err);
            actionButtons.classList.remove('hidden-for-export');
            downloadCalendarBtn.textContent = originalText;
            downloadCalendarBtn.disabled = false;
            alert('Error generating PNG. Please try again.');
        });
    }
    
    // Initialize with empty activities list message
    updateActivitiesList();
});