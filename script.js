// State dictionary storing the subjects and their entered study hours
let studyData = {};

/**
 * Grabs the subject name and hours from the inputs, validates them,
 * saves them to the dictionary, and refreshes the display.
 */
function addSubject() {
    const subjectInput = document.getElementById('subjectInput');
    const hoursInput = document.getElementById('hoursInput');
    
    const subject = subjectInput.value.trim();
    const hours = parseFloat(hoursInput.value);

    // Make sure a subject name was typed in
    if (!subject) {
        alert("Please enter a valid subject name.");
        subjectInput.focus();
        return;
    }

    // Make sure the hours entered are valid and non-negative
    if (isNaN(hours) || hours < 0) {
        alert("Please enter a valid non-negative number for study hours.");
        hoursInput.focus();
        return;
    }

    // Store the entry in our state dictionary
    studyData[subject] = hours;

    // Reset input fields and focus back to the subject input
    subjectInput.value = '';
    hoursInput.value = '';
    subjectInput.focus();
    
    updateSubjectChips();
}

/**
 * Removes a specific subject from the state and updates the UI.
 * @param {string} subjectName - Name of the subject to delete
 */
function removeSubject(subjectName) {
    delete studyData[subjectName];
    updateSubjectChips();
    
    // Hide the results section if all subjects have been removed
    if (Object.keys(studyData).length === 0) {
        document.getElementById('resultsSection').classList.add('hidden');
    }
}

/**
 * Re-renders the subject chips/tags and updates the counter badge in the UI.
 */
function updateSubjectChips() {
    const container = document.getElementById('subjectChips');
    const countBadge = document.getElementById('subjectCount');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const keys = Object.keys(studyData);

    countBadge.innerText = `${keys.length} Active`;

    // If no subjects exist, show placeholder text and disable the analyze button
    if (keys.length === 0) {
        container.innerHTML = `<p class="placeholder-text">No subjects added yet. Enter a subject above to get started!</p>`;
        analyzeBtn.disabled = true;
        return;
    }

    // Otherwise, enable the analyze button and draw the subject chips
    analyzeBtn.disabled = false;
    container.innerHTML = '';

    keys.forEach(subject => {
        const hours = studyData[subject];
        const chip = document.createElement('div');
        chip.className = 'chip-item';
        chip.innerHTML = `
            <span><strong>${escapeHtml(subject)}</strong>: ${hours} hrs</span>
            <button type="button" class="delete-chip" onclick="removeSubject('${escapeJsString(subject)}')" aria-label="Remove subject">×</button>
        `;
        container.appendChild(chip);
    });
}

/**
 * Calculates total hours, subject averages, assigns priority levels,
 * and updates the summary cards, table, and recommendations list.
 */
function runAnalysis() {
    const keys = Object.keys(studyData);
    if (keys.length === 0) {
        alert("No data entered. Exiting...");
        return;
    }

    // Calculate total hours and average study time
    let totalHours = 0;
    for (let subject in studyData) {
        totalHours += studyData[subject];
    }
    const avgHours = totalHours / keys.length;

    // Assign priorities based on how study hours compare to the average
    let priorityData = [];
    for (let subject in studyData) {
        let hours = studyData[subject];
        let priority = "";

        if (hours < avgHours) {
            priority = "HIGH";
        } else if (Math.abs(hours - avgHours) <= 0.5) {
            priority = "MEDIUM";
        } else {
            priority = "LOW";
        }
        priorityData.push([subject, hours, priority]);
    }

    // Sort records in ascending order by hours (least studied subjects first)
    priorityData.sort((a, b) => a[1] - b[1]);

    // Update the summary metrics view
    document.getElementById('totalHoursText').innerText = `${totalHours.toFixed(1)} hrs`;
    document.getElementById('avgHoursText').innerText = `${avgHours.toFixed(1)} hrs`;

    const leastSubject = priorityData[0];
    document.getElementById('leastStudiedText').innerText = `${leastSubject[0]} (${leastSubject[1].toFixed(1)} hrs)`;

    // Populate the records data table
    const tableBody = document.getElementById('tableBody');
    tableBody.innerHTML = '';

    priorityData.forEach(item => {
        const subject = item[0];
        const hours = item[1];
        const priority = item[2];

        let pillClass = "priority-pill ";
        if (priority.includes("HIGH")) pillClass += "high";
        else if (priority.includes("MEDIUM")) pillClass += "medium";
        else pillClass += "low";

        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${escapeHtml(subject)}</strong></td>
            <td>${hours.toFixed(1)} hrs</td>
            <td><span class="${pillClass}">${priority}</span></td>
        `;
        tableBody.appendChild(row);
    });

    // Populate the actionable recommendations list
    const recList = document.getElementById('recommendationsList');
    recList.innerHTML = '';

    priorityData.forEach(item => {
        const subject = item[0];
        const hours = item[1];
        const priority = item[2];
        let text = "";

        if (priority.includes("HIGH")) {
            text = `Increase study time for <strong>[${escapeHtml(subject)}]</strong> (currently ${hours.toFixed(1)} hrs)`;
        } else if (priority.includes("MEDIUM")) {
            text = `Maintain or slightly increase <strong>[${escapeHtml(subject)}]</strong> (${hours.toFixed(1)} hrs)`;
        } else {
            text = `Good balance for <strong>[${escapeHtml(subject)}]</strong> (${hours.toFixed(1)} hrs)`;
        }

        const li = document.createElement('li');
        li.innerHTML = text;
        recList.appendChild(li);
    });

    // Make the results section visible and smoothly scroll down to it
    const resultsSection = document.getElementById('resultsSection');
    resultsSection.classList.remove('hidden');
    resultsSection.scrollIntoView({ behavior: 'smooth' });
}

/**
 * Resets the application state back to default.
 */
function resetData() {
    studyData = {};
    updateSubjectChips();
    document.getElementById('resultsSection').classList.add('hidden');
}

/**
 * Escapes special HTML characters to prevent XSS issues.
 */
function escapeHtml(str) {
    return str.replace(/[&<>"']/g, function (m) {
        return {
            '&': '&',
            '<': '<',
            '>': '>',
            '"': '"',
            "'": "'"
        }[m];
    });
}

/**
 * Escapes quotes for string literals passed into inline JS function calls.
 */
function escapeJsString(str) {
    return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '\\"');
}

// Bind Enter key event listener to inputs so users can hit Enter to add subjects
document.addEventListener('DOMContentLoaded', () => {
    const subjectInput = document.getElementById('subjectInput');
    const hoursInput = document.getElementById('hoursInput');

    [subjectInput, hoursInput].forEach(input => {
        input.addEventListener('keyup', (event) => {
            if (event.key === 'Enter') {
                addSubject();
            }
        });
    });
});