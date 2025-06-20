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
    let activities = JSON.parse(localStorage.getItem('currentActivities')) || [];
    let currentlyEditingId = null;
    let currentScheduleName = localStorage.getItem('currentScheduleName') || null;
    
    // DOM elements
    const addActivityBtn = document.getElementById('add-activity');
    const generateCalendarBtn = document.getElementById('generate-calendar');
    const downloadCalendarBtn = document.getElementById('download-calendar');
    const saveScheduleBtn = document.getElementById('save-schedule');
    const scheduleNameInput = document.getElementById('schedule-name');
    const schedulesList = document.getElementById('schedules-list');
    
    // Event listeners
    addActivityBtn.addEventListener('click', addActivity);
    generateCalendarBtn.addEventListener('click', generateCalendar);
    downloadCalendarBtn.addEventListener('click', downloadCalendarAsPNG);
    saveScheduleBtn.addEventListener('click', saveCurrentSchedule);
    
    // Function to add or update activity
    function addActivity() {
        const dayCheckboxes = document.querySelectorAll('input[name="activity-days"]:checked');
        const startTime = document.getElementById('start-time').value;
        const endTime = document.getElementById('end-time').value;
        const name = document.getElementById('activity-name').value.trim();
        const desc = document.getElementById('activity-desc').value.trim();
        const availability = document.getElementById('availability').value;
        
        if (!name || !startTime || !endTime || dayCheckboxes.length === 0) {
            alert('Please fill in all required fields and select at least one day');
            return;
        }
        
        const selectedDays = Array.from(dayCheckboxes).map(cb => cb.value);
        
        if (currentlyEditingId !== null) {
            // Remove ALL existing activities with this ID (for editing)
            activities = activities.filter(activity => Math.floor(activity.id) !== Math.floor(currentlyEditingId));
            
            // Add updated activities for each selected day with the same base ID
            selectedDays.forEach(day => {
                activities.push({
                    day,
                    startTime,
                    endTime,
                    name,
                    desc,
                    availability,
                    id: currentlyEditingId + Math.random() // Keep same base ID but with new decimals
                });
            });
            
            currentlyEditingId = null;
            addActivityBtn.textContent = 'Pridėti veiklą';
        } else {
            // Add new activities for each selected day
            const baseId = Date.now();
            selectedDays.forEach(day => {
                const activity = {
                    day,
                    startTime,
                    endTime,
                    name,
                    desc,
                    availability,
                    id: baseId + Math.random() // Unique ID for each instance with same base
                };
                activities.push(activity);
            });
        }
        
        updateActivitiesList();
        clearForm();
        saveCurrentState();
    }
    
    // Function to update activities list
    function updateActivitiesList() {
        const activitiesList = document.getElementById('activities-list');
        activitiesList.innerHTML = '';
        
        if (activities.length === 0) {
            activitiesList.innerHTML = '<p style="color: #6E6761; font-size: 12px; text-align: center;">Veiklų nėra</p>';
            return;
        }
        
        // Group activities by their base ID (for display purposes)
        const groupedActivities = {};
        activities.forEach(activity => {
            const baseId = Math.floor(activity.id); // Get the base ID without the decimal
            if (!groupedActivities[baseId]) {
                groupedActivities[baseId] = {
                    ...activity,
                    days: [activity.day],
                    instances: [activity]
                };
            } else {
                if (!groupedActivities[baseId].days.includes(activity.day)) {
                    groupedActivities[baseId].days.push(activity.day);
                }
                groupedActivities[baseId].instances.push(activity);
            }
        });
        
        Object.values(groupedActivities).forEach(group => {
            const activityItem = document.createElement('div');
            activityItem.className = `activity-item activity-${group.availability}`;
            activityItem.dataset.id = group.id;
            
            activityItem.innerHTML = `
                <div class="activity-details">
                    <div class="activity-day">${group.days.join(', ')}</div>
                    <div class="activity-time">${group.startTime} - ${group.endTime}</div>
                    <div class="activity-name">${group.name}</div>
                    ${group.desc ? `<div class="activity-description">${group.desc}</div>` : ''}
                    <div class="activity-availability">${formatAvailability(group.availability)}</div>
                </div>
                <div class="activity-actions">
                    <button class="copy-activity" data-id="${group.id}" title="Copy to another day">Kopijuoti</button>
                    <button class="edit-activity" data-id="${group.id}">Redaguoti</button>
                    <button class="remove-activity" data-id="${group.id}">×</button>
                </div>
            `;
            
            activitiesList.appendChild(activityItem);
        });
        
        // Add event listeners for all action buttons
        document.querySelectorAll('.remove-activity').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = parseFloat(this.dataset.id);
                removeActivity(id);
            });
        });
        
        document.querySelectorAll('.edit-activity').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = parseFloat(this.dataset.id);
                editActivity(id);
            });
        });
        
        document.querySelectorAll('.copy-activity').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = parseFloat(this.dataset.id);
                copyActivity(id);
            });
        });
    }
    
    // Function to remove an activity
    function removeActivity(id) {
        if (confirm('Ar tikrai norite pašalinti šią veiklą?')) {
            activities = activities.filter(activity => Math.floor(activity.id) !== Math.floor(id));
            updateActivitiesList();
            saveCurrentState();
        }
    }
    
    // Function to edit an activity
    function editActivity(id) {
        // Find all activities with this base ID
        const activityInstances = activities.filter(activity => Math.floor(activity.id) === Math.floor(id));
        if (activityInstances.length === 0) return;
        
        // Take the first instance to populate the form
        const firstInstance = activityInstances[0];
        
        // Uncheck all day checkboxes first
        document.querySelectorAll('input[name="activity-days"]').forEach(cb => {
            cb.checked = false;
        });
        
        // Check the boxes for the days this activity occurs
        activityInstances.forEach(instance => {
            const checkbox = document.querySelector(`input[name="activity-days"][value="${instance.day}"]`);
            if (checkbox) checkbox.checked = true;
        });
        
        document.getElementById('start-time').value = firstInstance.startTime;
        document.getElementById('end-time').value = firstInstance.endTime;
        document.getElementById('activity-name').value = firstInstance.name;
        document.getElementById('activity-desc').value = firstInstance.desc;
        document.getElementById('availability').value = firstInstance.availability;
        
        currentlyEditingId = id;
        addActivityBtn.textContent = 'Atnaujinti veiklą';
        
        // Scroll to form with smooth animation
        const formSection = document.querySelector('.form-section');
        formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
        // Highlight the form section temporarily
        formSection.style.boxShadow = '0 0 0 0px #444';
        setTimeout(() => {
            formSection.style.boxShadow = 'none';
        }, 2000);
    }
    
    // Function to copy an activity to another day
    function copyActivity(id) {
        const originalActivities = activities.filter(activity => Math.floor(activity.id) === Math.floor(id));
        if (originalActivities.length === 0) return;
        
        // Prompt user to select new days
        const newDaysInput = prompt("Įveskite dienas, į kurias norite nukopijuoti veiklą (atskirtas kableliais):\nPavyzdys: Pirmadienis, Trečiadienis, Penktadienis");
        if (!newDaysInput) return; // User canceled
        
        const newDays = newDaysInput.split(',').map(day => day.trim());
        
        // Validate the days
        const validDays = ['Pirmadienis', 'Antradienis', 'Trečiadienis', 'Ketvirtadienis', 'Penktadienis', 'Šeštadienis', 'Sekmadienis'];
        const invalidDays = newDays.filter(day => !validDays.includes(day));
        
        if (invalidDays.length > 0) {
            alert(`Netinkamos dienos: ${invalidDays.join(', ')}\nGalimos dienos: Pirmadienis, Antradienis, Trečiadienis, Ketvirtadienis, Penktadienis, Šeštadienis, Sekmadienis`);
            return;
        }
        
        // Create copies for each new day
        originalActivities.forEach(originalActivity => {
            newDays.forEach(day => {
                const copiedActivity = {
                    ...originalActivity,
                    day: day,
                    id: Date.now() + Math.random() // New unique ID for each copy
                };
                activities.push(copiedActivity);
            });
        });
        
        updateActivitiesList();
        saveCurrentState();
        
        // Scroll to the bottom of the activities list
        setTimeout(() => {
            const activitiesList = document.getElementById('activities-list');
            activitiesList.scrollTop = activitiesList.scrollHeight;
        }, 100);
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
        document.querySelectorAll('input[name="activity-days"]').forEach(cb => {
            cb.checked = false;
        });
        currentlyEditingId = null;
        addActivityBtn.textContent = 'Pridėti veiklą';
    }
    
    // Function to generate calendar with aligned activities
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
        
        // First, sort all activities by start time
        const sortedActivities = [...activities].sort((a, b) => {
            return a.startTime.localeCompare(b.startTime);
        });
        
        // Group activities by day
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
        
        // Find all unique time slots across all days
        const allTimeSlots = new Set();
        sortedActivities.forEach(activity => {
            allTimeSlots.add(`${activity.startTime}-${activity.endTime}`);
        });
        
        // Create a grid structure to align activities
        const timeSlotArray = Array.from(allTimeSlots).sort();
        
        // For each time slot, find activities in each day
        timeSlotArray.forEach(timeSlot => {
            const [startTime, endTime] = timeSlot.split('-');
            
            // Find the maximum height needed for this time slot across all days
            let maxItems = 1;
            for (const day in activitiesByDay) {
                const dayActivities = activitiesByDay[day].filter(a => 
                    a.startTime === startTime && a.endTime === endTime
                );
                if (dayActivities.length > maxItems) {
                    maxItems = dayActivities.length;
                }
            }
            
            // Add activities to each day, creating aligned rows
            for (let i = 0; i < maxItems; i++) {
                for (const day in activitiesByDay) {
                    const dayElement = Array.from(document.querySelectorAll('.calendar-day'))
                        .find(el => el.querySelector('.day-header').textContent === day);
                    
                    const dayActivities = activitiesByDay[day].filter(a => 
                        a.startTime === startTime && a.endTime === endTime
                    );
                    
                    if (i < dayActivities.length) {
                        const activity = dayActivities[i];
                        const activityElement = document.createElement('div');
                        activityElement.className = `calendar-activity activity-${activity.availability}`;
                        activityElement.innerHTML = `
                            <div class="activity-time-display">${activity.startTime} - ${activity.endTime}</div>
                            <div class="activity-name-display">${activity.name}</div>
                            ${activity.desc ? `<div class="activity-desc-display" style="margin-top: 3px; font-size: 10px;">${activity.desc}</div>` : ''}
                            <div class="availability-badge">${formatAvailability(activity.availability)}</div>
                        `;
                        dayElement.appendChild(activityElement);
                    } else if (i === 0) {
                        // Add empty placeholder to maintain alignment
                        const emptyElement = document.createElement('div');
                        emptyElement.className = 'calendar-activity empty-activity';
                        emptyElement.style.visibility = 'hidden';
                        emptyElement.innerHTML = `<div style="height: 1px;"></div>`;
                        dayElement.appendChild(emptyElement);
                    }
                }
            }
        });
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
    
    // Function to save current schedule
    function saveCurrentSchedule() {
        const scheduleName = scheduleNameInput.value.trim();
        if (!scheduleName) {
            alert('Please enter a schedule name');
            return;
        }
        
        if (scheduleName === "naujas tvarkaraštis") {
            alert('This name is reserved for the empty schedule');
            return;
        }
        
        const scheduleData = {
            name: scheduleName,
            activities: [...activities], // Copy of current activities
            timestamp: new Date().toISOString()
        };
        
        // Get existing schedules or initialize empty array
        const savedSchedules = JSON.parse(localStorage.getItem('savedSchedules')) || [];
        
        // Check if this name already exists
        const existingIndex = savedSchedules.findIndex(s => s.name === scheduleName);
        if (existingIndex >= 0) {
            if (!confirm(`Schedule "${scheduleName}" already exists. Overwrite?`)) {
                return;
            }
            savedSchedules[existingIndex] = scheduleData;
        } else {
            savedSchedules.push(scheduleData);
        }
        
        localStorage.setItem('savedSchedules', JSON.stringify(savedSchedules));
        localStorage.setItem('currentScheduleName', scheduleName);
        currentScheduleName = scheduleName;
        scheduleNameInput.value = '';
        updateSchedulesList();
        saveCurrentState();
    }
    
    // Function to save current state to localStorage
    function saveCurrentState() {
        localStorage.setItem('currentActivities', JSON.stringify(activities));
        if (currentScheduleName) {
            localStorage.setItem('currentScheduleName', currentScheduleName);
        }
    }
    
    // Function to load a saved schedule
    function loadSchedule(scheduleName) {
        // Clear the generated calendar first
        document.querySelectorAll('.calendar-day').forEach(dayElement => {
            const dayHeader = dayElement.querySelector('.day-header');
            dayElement.innerHTML = '';
            dayElement.appendChild(dayHeader);
        });
        
        if (scheduleName === "naujas tvarkaraštis") {
            activities = [];
            currentScheduleName = null;
            localStorage.removeItem('currentScheduleName');
            localStorage.removeItem('currentActivities');
            updateActivitiesList();
            return;
        }
        
        const savedSchedules = JSON.parse(localStorage.getItem('savedSchedules')) || [];
        const scheduleToLoad = savedSchedules.find(s => s.name === scheduleName);
        
        if (scheduleToLoad) {
            activities = [...scheduleToLoad.activities];
            currentScheduleName = scheduleName;
            localStorage.setItem('currentScheduleName', scheduleName);
            localStorage.setItem('currentActivities', JSON.stringify(activities));
            updateActivitiesList();
            alert(`Schedule "${scheduleName}" loaded successfully!`);
        }
    }
    
    // Function to delete a saved schedule
    function deleteSchedule(scheduleName, event) {
        if (event) event.stopPropagation();
        
        if (scheduleName === "naujas tvarkaraštis") {
            alert('Cannot delete the default empty schedule');
            return;
        }
        
        if (!confirm(`Are you sure you want to delete "${scheduleName}"?`)) {
            return;
        }
        
        const savedSchedules = JSON.parse(localStorage.getItem('savedSchedules')) || [];
        const updatedSchedules = savedSchedules.filter(s => s.name !== scheduleName);
        
        localStorage.setItem('savedSchedules', JSON.stringify(updatedSchedules));
        
        // If we're deleting the currently loaded schedule, clear it
        if (currentScheduleName === scheduleName) {
            activities = [];
            currentScheduleName = null;
            localStorage.removeItem('currentScheduleName');
            localStorage.removeItem('currentActivities');
            updateActivitiesList();
        }
        
        updateSchedulesList();
    }
    
    // Function to update the schedules list display
    function updateSchedulesList() {
        const savedSchedules = JSON.parse(localStorage.getItem('savedSchedules')) || [];
        schedulesList.innerHTML = '';
        
        // Always show "naujas tvarkaraštis" first
        const newScheduleElement = document.createElement('div');
        newScheduleElement.className = 'schedule-item';
        
        const newScheduleBtn = document.createElement('button');
        newScheduleBtn.className = 'schedule-btn';
        newScheduleBtn.textContent = 'naujas tvarkaraštis';
        newScheduleBtn.addEventListener('click', () => loadSchedule('naujas tvarkaraštis'));
        
        newScheduleElement.appendChild(newScheduleBtn);
        schedulesList.appendChild(newScheduleElement);
        
        if (savedSchedules.length === 0) {
            return;
        }
        
        // Sort schedules by timestamp (newest first)
        savedSchedules.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        savedSchedules.forEach(schedule => {
            const scheduleElement = document.createElement('div');
            scheduleElement.className = 'schedule-item';
            
            const scheduleBtn = document.createElement('button');
            scheduleBtn.className = 'schedule-btn';
            scheduleBtn.textContent = schedule.name;
            scheduleBtn.addEventListener('click', () => loadSchedule(schedule.name));
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'remove-activity';
            deleteBtn.innerHTML = '×';
            deleteBtn.title = 'Delete this schedule';
            deleteBtn.addEventListener('click', (e) => deleteSchedule(schedule.name, e));
            
            scheduleElement.appendChild(scheduleBtn);
            scheduleElement.appendChild(deleteBtn);
            schedulesList.appendChild(scheduleElement);
        });
    }
    
    // Initialize with saved activities and schedules list
    updateActivitiesList();
    updateSchedulesList();
    
    // If we have a current schedule name but no activities, try to load it
    if (currentScheduleName && activities.length === 0) {
        loadSchedule(currentScheduleName);
    }
});
