// ==========================================================================
// TOAST NOTIFICATION UTILITY
// ==========================================================================
const toast = document.getElementById("toast");
let toastTimeout;

function showToast(message, type = "success") {
    clearTimeout(toastTimeout);
    
    if (toast) {
        toast.textContent = message;
        toast.className = `toast show ${type}`;
        
        toastTimeout = setTimeout(() => {
            toast.className = "toast hidden";
        }, 4500);
    }
}

// ==========================================================================
// GLOBAL DOCUMENT SETTINGS & FONT STATE (Default: Poppins)
// ==========================================================================
let selectedFont = "Poppins";

function initSettingsModal() {
    const btnOpenSettings = document.getElementById("btnOpenSettings");
    const btnCloseSettings = document.getElementById("btnCloseSettings");
    const btnSaveSettings = document.getElementById("btnSaveSettings");
    const modal = document.getElementById("settingsModal");
    const docFontSelect = document.getElementById("docFontSelect");

    if (btnOpenSettings && modal) {
        btnOpenSettings.addEventListener("click", () => {
            modal.classList.remove("hidden");
        });
    }

    if (btnCloseSettings && modal) {
        btnCloseSettings.addEventListener("click", () => {
            modal.classList.add("hidden");
        });
    }

    if (btnSaveSettings && modal && docFontSelect) {
        btnSaveSettings.addEventListener("click", () => {
            selectedFont = docFontSelect.value;
            modal.classList.add("hidden");
            renderLiveDocumentPreview();
            showToast(`Document font updated to ${selectedFont}!`, "success");
        });
    }
}

// ==========================================================================
// ROMAN NUMERAL CONVERTER HELPER
// ==========================================================================
function getRomanNumeral(num) {
    const romans = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
    return romans[num - 1] || num.toString();
}

function parseRomanOrNumber(str) {
    const s = str.toUpperCase().trim();
    if (s === "I" || s === "1") return 1;
    if (s === "II" || s === "2") return 2;
    if (s === "III" || s === "3") return 3;
    if (s === "IV" || s === "4") return 4;
    if (s === "V" || s === "5") return 5;
    return parseInt(s, 10) || 0;
}

// Clean bullet, box, tab, and numeric list prefixes completely from input fields
function cleanPrefix(str) {
    if (!str) return "";
    return str.replace(/^[\u25AF\u25A0\u25A1●•\-\*\s\t]+/, "")
              .replace(/^(\d+[\.\)\s\t]+|\[CO\d+\]|CO\d+[\:\-\s]+)\s*/i, "")
              .replace(/^[\u25AF\u25A0\u25A1●•\-\*\s\t]+/, "")
              .trim();
}

// ==========================================================================
// DYNAMIC INPUT LIST BUILDER
// ==========================================================================
function initDynamicList(containerId, addBtnId, removeBtnId, placeholder, required = true) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const addBtn = document.getElementById(addBtnId);
    const removeBtn = document.getElementById(removeBtnId);

    const bulkWrap = document.createElement("div");
    bulkWrap.className = "bulk-import-wrap";
    
    const bulkTextarea = document.createElement("textarea");
    bulkTextarea.className = "bulk-textarea";
    bulkTextarea.rows = 2;
    bulkTextarea.placeholder = "⚡ Paste list items here to auto-detect and add multiple rows...";
    
    const bulkActions = document.createElement("div");
    bulkActions.className = "button-group flex-end";
    
    const importBtn = document.createElement("button");
    importBtn.type = "button";
    importBtn.className = "btn btn-secondary";
    importBtn.style.padding = "0.25rem 0.75rem";
    importBtn.style.fontSize = "0.85rem";
    importBtn.textContent = "Detect & Import";
    
    bulkActions.appendChild(importBtn);
    bulkWrap.appendChild(bulkTextarea);
    bulkWrap.appendChild(bulkActions);
    
    container.after(bulkWrap);

    const processPasteText = () => {
        const text = bulkTextarea.value.trim();
        if (text) {
            const lines = text.split(/\r?\n/).map(line => cleanPrefix(line)).filter(line => line.length > 0);
            if (lines.length > 0) {
                setDynamicListValues(containerId, addBtnId, lines);
                renderLiveDocumentPreview();
                showToast(`Auto-detected and imported ${lines.length} items!`, "success");
            }
            bulkTextarea.value = "";
        }
    };

    bulkTextarea.addEventListener("paste", () => {
        setTimeout(processPasteText, 10);
    });

    importBtn.onclick = processPasteText;

    if (addBtn) {
        addBtn.addEventListener("click", () => {
            const rowCount = container.children.length + 1;
            const row = createRowElement(containerId, rowCount, "", placeholder, required);
            container.appendChild(row);
        });
    }
    if (removeBtn) {
        removeBtn.addEventListener("click", () => {
            if (container.children.length > 1) {
                container.lastElementChild.remove();
                renderLiveDocumentPreview();
            } else {
                showToast("At least one entry is required in this list.", "error");
            }
        });
    }

    if (container.children.length === 0) {
        container.appendChild(createRowElement(containerId, 1, "", placeholder, required));
    }
}

function createRowElement(containerId, rowCount, value = "", placeholder = "", required = true) {
    const container = document.getElementById(containerId);
    const row = document.createElement("div");
    row.className = "dynamic-row";
    
    const numSpan = document.createElement("span");
    numSpan.className = "row-num";
    numSpan.textContent = rowCount + ".";

    const input = document.createElement("input");
    input.type = "text";
    input.className = "row-input";
    input.placeholder = placeholder;
    input.value = cleanPrefix(value);
    
    if (required) {
        input.setAttribute("required", "required");
    }

    input.addEventListener("paste", (e) => {
        const pastedText = (e.clipboardData || window.clipboardData).getData("text");
        if (pastedText.includes("\n") || pastedText.includes("\r")) {
            e.preventDefault();
            const lines = pastedText.split(/\r?\n/).map(line => cleanPrefix(line)).filter(line => line.length > 0);
            if (lines.length > 0) {
                setDynamicListValues(containerId, null, lines);
                renderLiveDocumentPreview();
                showToast(`Auto-detected and added ${lines.length} items!`, "success");
            }
        }
    });

    input.addEventListener("input", () => {
        input.value = cleanPrefix(input.value);
        if (input.value.trim() !== "") {
            input.classList.remove("invalid");
            const errorSpan = row.querySelector(".error-message");
            if (errorSpan) errorSpan.remove();
        }
        renderLiveDocumentPreview();
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "btn-row-remove";
    deleteBtn.innerHTML = "&times;";
    deleteBtn.title = "Delete this row";
    deleteBtn.onclick = () => {
        if (container.children.length > 1) {
            row.remove();
            Array.from(container.children).forEach((child, index) => {
                child.querySelector(".row-num").textContent = (index + 1) + ".";
            });
            renderLiveDocumentPreview();
        }
    };

    row.appendChild(numSpan);
    row.appendChild(input);
    row.appendChild(deleteBtn);
    return row;
}

// PROGRAMMATIC MULTI-ROW POPULATOR
function setDynamicListValues(containerId, addBtnId, values) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = "";
    const cleanValues = (values || []).map(v => cleanPrefix(v)).filter(Boolean);
    const finalValues = cleanValues.length > 0 ? cleanValues : [""];

    finalValues.forEach((val, index) => {
        const row = createRowElement(containerId, index + 1, val, "Enter details...", false);
        container.appendChild(row);
    });
}

function getListValues(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return [];
    const inputs = container.querySelectorAll(".row-input");
    const values = [];
    inputs.forEach(input => {
        const val = cleanPrefix(input.value);
        if (val) {
            values.push(val);
        }
    });
    return values;
}

// ==========================================================================
// COURSE TYPE TOGGLING & DOM MANAGERS
// ==========================================================================
const courseTypeSelect = document.getElementById("courseType");
const theorySection = document.getElementById("theorySection");
const labSection = document.getElementById("labSection");
const hoursInputs = document.querySelectorAll(".unit-hours-input");
const totalHoursVal = document.getElementById("totalHoursVal");

function toggleInputs(container, enable) {
    if (!container) return;
    const inputs = container.querySelectorAll("input, textarea, select");
    inputs.forEach(input => {
        if (enable) {
            input.removeAttribute("disabled");
            const isOptionalList = input.closest("#activitiesContainer") || input.closest("#evaluationsContainer");
            if (!isOptionalList && (input.classList.contains("row-input") || input.hasAttribute("data-was-required") || input.id.includes("Title") || input.id.includes("Hours") || input.id.includes("Syllabus"))) {
                input.setAttribute("required", "required");
            }
        } else {
            input.setAttribute("disabled", "disabled");
            if (input.hasAttribute("required")) {
                input.setAttribute("data-was-required", "true");
            }
            input.removeAttribute("required");
            input.classList.remove("invalid");
            const parent = input.parentElement;
            const error = parent.querySelector(".error-message");
            if (error) error.remove();
        }
    });
}

function handleCourseTypeChange() {
    if (!courseTypeSelect) return;
    const type = courseTypeSelect.value;
    
    if (type === "Theory") {
        if (theorySection) theorySection.classList.remove("hidden");
        if (labSection) labSection.classList.add("hidden");
        toggleInputs(theorySection, true);
        toggleInputs(labSection, false);
    } else if (type === "Lab") {
        if (theorySection) theorySection.classList.add("hidden");
        if (labSection) labSection.classList.remove("hidden");
        toggleInputs(theorySection, false);
        toggleInputs(labSection, true);
    } else if (type === "Lab Oriented Theory") {
        if (theorySection) theorySection.classList.remove("hidden");
        if (labSection) labSection.classList.remove("hidden");
        toggleInputs(theorySection, true);
        toggleInputs(labSection, true);
    }
    
    calculateTotalHours();
    renderLiveDocumentPreview();
}

function calculateTotalHours() {
    let total = 0;
    for (let i = 1; i <= 5; i++) {
        const uHoursEl = document.getElementById(`unit${i}Hours`);
        if (uHoursEl && !uHoursEl.disabled) {
            const val = parseFloat(uHoursEl.value) || 0;
            total += val;
        }
    }
    if (totalHoursVal) totalHoursVal.textContent = total;
    return total;
}

if (courseTypeSelect) courseTypeSelect.addEventListener("change", handleCourseTypeChange);

hoursInputs.forEach(input => {
    input.addEventListener("input", () => {
        calculateTotalHours();
        renderLiveDocumentPreview();
    });
});

document.querySelectorAll("#syllabusForm input, #syllabusForm textarea, #syllabusForm select").forEach(el => {
    el.addEventListener("input", () => {
        if (el.checkValidity()) {
            el.classList.remove("invalid");
            const error = el.parentElement.querySelector(".error-message");
            if (error) error.remove();
        }
        renderLiveDocumentPreview();
    });
});

const branchesInputEl = document.getElementById("branches");
if (branchesInputEl) {
    branchesInputEl.addEventListener("input", () => {
        renderLiveDocumentPreview();
    });
}

// ==========================================================================
// FORM SUBMIT & DOCX GENERATION LOGIC
// ==========================================================================
const form = document.getElementById("syllabusForm");
const validationBanner = document.getElementById("validationBanner");
const generateDocBtn = document.getElementById("generateDocBtn");

if (form) {
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        let isValid = true;
        const inputs = form.querySelectorAll("input, textarea, select");
        
        document.querySelectorAll(".error-message").forEach(el => el.remove());
        inputs.forEach(el => el.classList.remove("invalid"));
        
        inputs.forEach(input => {
            if (!input.disabled && !input.checkValidity()) {
                isValid = false;
                input.classList.add("invalid");
                
                const errorSpan = document.createElement("span");
                errorSpan.className = "error-message";
                if (input.validity.valueMissing) {
                    errorSpan.textContent = "This field is required.";
                } else if (input.validity.rangeUnderflow) {
                    errorSpan.textContent = `Value must be at least ${input.min}.`;
                } else {
                    errorSpan.textContent = "Invalid value.";
                }
                input.parentElement.appendChild(errorSpan);
            }
        });

        if (!isValid) {
            validationBanner.classList.remove("hidden");
            showToast("Form validation failed. Please fix highlighted fields.", "error");
            
            const firstInvalid = form.querySelector(".invalid");
            if (firstInvalid) {
                firstInvalid.scrollIntoView({ behavior: "smooth", block: "center" });
                firstInvalid.focus();
            }
            return;
        }
        
        validationBanner.classList.add("hidden");
        
        generateDocBtn.disabled = true;
        generateDocBtn.querySelector(".btn-text").textContent = "Generating DOCX...";
        generateDocBtn.querySelector(".btn-spinner").classList.remove("hidden");
        
        try {
            await generateWordDocument();
            showToast("Syllabus DOCX generated successfully!", "success");
        } catch (err) {
            console.error("DOCX generation error:", err);
            showToast(`Failed to generate document: ${err.message}`, "error");
        } finally {
            generateDocBtn.disabled = false;
            generateDocBtn.querySelector(".btn-text").textContent = "📄 Generate Publication DOCX";
            generateDocBtn.querySelector(".btn-spinner").classList.add("hidden");
        }
    });
}

// ==========================================================================
// DOCX COMPILATION USING DOCX.JS (WITH BULLETS FOR OBJECTIVES & OUTCOMES)
// ==========================================================================
async function generateWordDocument() {
    if (!window.docx) {
        throw new Error("Word document generation library (docx.js) could not be loaded. Check internet connection.");
    }

    const {
        Document,
        Packer,
        Paragraph,
        TextRun,
        Table,
        TableRow,
        TableCell,
        WidthType,
        BorderStyle,
        AlignmentType,
        PageOrientation,
        VerticalAlign
    } = window.docx;

    function createRun(text, bold = false, size = 24) {
        return new TextRun({
            text: text,
            bold: bold,
            size: size,
            font: selectedFont
        });
    }

    const courseType = courseTypeSelect ? courseTypeSelect.value : "Theory";
    const subjectCode = (document.getElementById("subjectCode")?.value || "").trim().toUpperCase();
    const subjectName = (document.getElementById("subjectName")?.value || "").trim();
    const category = (document.getElementById("category")?.value || "").trim();
    const lValue = document.getElementById("lValue")?.value || "0";
    const tValue = document.getElementById("tValue")?.value || "0";
    const pValue = document.getElementById("pValue")?.value || "0";
    const cValue = document.getElementById("cValue")?.value || "0";
    const branches = (document.getElementById("branches")?.value || "").trim();

    const cellMargins = { top: 120, bottom: 120, left: 144, right: 144 };
    const tableBorders = {
        top: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
        bottom: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
        left: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
        right: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
        insideVertical: { style: BorderStyle.SINGLE, size: 4, color: "000000" }
    };

    const docChildren = [];

    // Table 1: Course Details (Subject Title CENTER aligned with Poppins Font)
    const basicInfoTable = new Table({
        width: { size: 10204, type: WidthType.DXA },
        borders: tableBorders,
        rows: [
            new TableRow({
                children: [
                    new TableCell({
                        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [createRun("Course Code", true)] })],
                        verticalAlign: VerticalAlign.CENTER, margins: cellMargins, width: { size: 1701, type: WidthType.DXA }
                    }),
                    new TableCell({
                        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [createRun("Course Title", true)] })],
                        verticalAlign: VerticalAlign.CENTER, margins: cellMargins, width: { size: 4818, type: WidthType.DXA }
                    }),
                    new TableCell({
                        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [createRun("Category", true)] })],
                        verticalAlign: VerticalAlign.CENTER, margins: cellMargins, width: { size: 1417, type: WidthType.DXA }
                    }),
                    new TableCell({
                        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [createRun("L", true)] })],
                        verticalAlign: VerticalAlign.CENTER, margins: cellMargins, width: { size: 567, type: WidthType.DXA }
                    }),
                    new TableCell({
                        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [createRun("T", true)] })],
                        verticalAlign: VerticalAlign.CENTER, margins: cellMargins, width: { size: 567, type: WidthType.DXA }
                    }),
                    new TableCell({
                        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [createRun("P", true)] })],
                        verticalAlign: VerticalAlign.CENTER, margins: cellMargins, width: { size: 567, type: WidthType.DXA }
                    }),
                    new TableCell({
                        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [createRun("C", true)] })],
                        verticalAlign: VerticalAlign.CENTER, margins: cellMargins, width: { size: 567, type: WidthType.DXA }
                    })
                ]
            }),
            new TableRow({
                children: [
                    new TableCell({
                        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [createRun(subjectCode, false)] })],
                        verticalAlign: VerticalAlign.CENTER, margins: cellMargins, width: { size: 1701, type: WidthType.DXA }
                    }),
                    new TableCell({
                        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [createRun(subjectName, true)] })],
                        verticalAlign: VerticalAlign.CENTER, margins: cellMargins, width: { size: 4818, type: WidthType.DXA }
                    }),
                    new TableCell({
                        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [createRun(category, false)] })],
                        verticalAlign: VerticalAlign.CENTER, margins: cellMargins, width: { size: 1417, type: WidthType.DXA }
                    }),
                    new TableCell({
                        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [createRun(lValue, false)] })],
                        verticalAlign: VerticalAlign.CENTER, margins: cellMargins, width: { size: 567, type: WidthType.DXA }
                    }),
                    new TableCell({
                        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [createRun(tValue, false)] })],
                        verticalAlign: VerticalAlign.CENTER, margins: cellMargins, width: { size: 567, type: WidthType.DXA }
                    }),
                    new TableCell({
                        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [createRun(pValue, false)] })],
                        verticalAlign: VerticalAlign.CENTER, margins: cellMargins, width: { size: 567, type: WidthType.DXA }
                    }),
                    new TableCell({
                        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [createRun(cValue, false)] })],
                        verticalAlign: VerticalAlign.CENTER, margins: cellMargins, width: { size: 567, type: WidthType.DXA }
                    })
                ]
            }),
            new TableRow({
                children: [
                    new TableCell({
                        children: [new Paragraph({
                            alignment: AlignmentType.LEFT,
                            children: [
                                createRun("Branches: ", true),
                                createRun(branches, false)
                            ]
                        })],
                        columnSpan: 7, verticalAlign: VerticalAlign.CENTER, margins: cellMargins, width: { size: 10204, type: WidthType.DXA }
                    })
                ]
            })
        ]
    });

    docChildren.push(basicInfoTable);

    function addTableSpacer() {
        docChildren.push(new Paragraph({ spacing: { before: 120, after: 120 }, children: [] }));
    }

    // Objectives Table (With Bullet Output in DOCX)
    const objectives = getListValues("objectivesContainer");
    if (objectives.length > 0) {
        addTableSpacer();
        const objectiveRows = [
            new TableRow({
                children: [
                    new TableCell({
                        children: [new Paragraph({ children: [createRun("Objectives:", true)], alignment: AlignmentType.LEFT })],
                        margins: cellMargins, width: { size: 10204, type: WidthType.DXA }
                    })
                ]
            })
        ];
        objectives.forEach(obj => {
            objectiveRows.push(new TableRow({
                children: [
                    new TableCell({
                        children: [new Paragraph({ children: [createRun(`●  ${cleanPrefix(obj)}`, false)], alignment: AlignmentType.LEFT })],
                        margins: cellMargins, width: { size: 10204, type: WidthType.DXA }
                    })
                ]
            }));
        });
        docChildren.push(new Table({ width: { size: 10204, type: WidthType.DXA }, borders: tableBorders, rows: objectiveRows }));
    }

    // Theory Syllabus Units Table
    if (courseType === "Theory" || courseType === "Lab Oriented Theory") {
        addTableSpacer();
        const unitTableRows = [];
        let computedTotalHours = 0;

        for (let i = 1; i <= 5; i++) {
            const unitTitleEl = document.getElementById(`unit${i}Title`);
            const unitHoursEl = document.getElementById(`unit${i}Hours`);
            const unitSyllabusEl = document.getElementById(`unit${i}Syllabus`);

            const unitTitle = unitTitleEl ? unitTitleEl.value.trim() : "";
            const unitHours = unitHoursEl ? unitHoursEl.value : "0";
            const rawSyllabus = unitSyllabusEl ? unitSyllabusEl.value.trim() : "";
            const roman = getRomanNumeral(i);
            
            const hoursNum = parseInt(unitHours, 10) || 0;
            computedTotalHours += hoursNum;

            unitTableRows.push(new TableRow({
                children: [
                    new TableCell({
                        children: [new Paragraph({ children: [createRun(`UNIT-${roman}`, true)] })],
                        verticalAlign: VerticalAlign.CENTER, margins: cellMargins, width: { size: 1304, type: WidthType.DXA }
                    }),
                    new TableCell({
                        children: [new Paragraph({ alignment: AlignmentType.LEFT, children: [createRun(unitTitle.toUpperCase(), true)] })],
                        verticalAlign: VerticalAlign.CENTER, margins: cellMargins, width: { size: 8050, type: WidthType.DXA }
                    }),
                    new TableCell({
                        children: [new Paragraph({ children: [createRun(unitHours, true)], alignment: AlignmentType.RIGHT })],
                        verticalAlign: VerticalAlign.CENTER, margins: cellMargins, width: { size: 850, type: WidthType.DXA }
                    })
                ]
            }));

            const cleanedSyllabus = rawSyllabus.split(/\r?\n/).map(l => l.trim()).filter(Boolean).join(" ").replace(/\s+/g, " ");
            const syllabusParagraphs = [
                new Paragraph({ children: [createRun(cleanedSyllabus, false)], alignment: AlignmentType.JUSTIFIED })
            ];

            unitTableRows.push(new TableRow({
                children: [
                    new TableCell({ children: syllabusParagraphs, columnSpan: 3, margins: cellMargins, width: { size: 10204, type: WidthType.DXA } })
                ]
            }));
        }

        unitTableRows.push(new TableRow({
            children: [
                new TableCell({
                    children: [new Paragraph({
                        children: [
                            createRun("Total Contact Hours: ", true),
                            createRun(computedTotalHours.toString(), false)
                        ],
                        alignment: AlignmentType.LEFT
                    })],
                    columnSpan: 3, margins: cellMargins, width: { size: 10204, type: WidthType.DXA }
                })
            ]
        }));

        docChildren.push(new Table({ width: { size: 10204, type: WidthType.DXA }, borders: tableBorders, rows: unitTableRows }));
    }

    // List of Experiments Table
    if (courseType === "Lab" || courseType === "Lab Oriented Theory") {
        const experiments = getListValues("experimentsContainer");
        if (experiments.length > 0) {
            addTableSpacer();
            const experimentRows = [
                new TableRow({
                    children: [
                        new TableCell({
                            children: [new Paragraph({ children: [createRun("LIST OF EXPERIMENTS", true)], alignment: AlignmentType.LEFT })],
                            columnSpan: 2, margins: cellMargins, width: { size: 10204, type: WidthType.DXA }
                        })
                    ]
                })
            ];

            experiments.forEach((exp, idx) => {
                experimentRows.push(new TableRow({
                    children: [
                        new TableCell({
                            children: [new Paragraph({ children: [createRun((idx + 1).toString(), true)], alignment: AlignmentType.CENTER })],
                            verticalAlign: VerticalAlign.CENTER, margins: cellMargins, width: { size: 567, type: WidthType.DXA }
                        }),
                        new TableCell({
                            children: [new Paragraph({ children: [createRun(cleanPrefix(exp), false)], alignment: AlignmentType.LEFT })],
                            verticalAlign: VerticalAlign.CENTER, margins: cellMargins, width: { size: 9637, type: WidthType.DXA }
                        })
                    ]
                }));
            });

            docChildren.push(new Table({ width: { size: 10204, type: WidthType.DXA }, borders: tableBorders, rows: experimentRows }));
        }
    }

    // Course Outcomes Table (With Bullet Output in DOCX)
    const outcomes = getListValues("outcomesContainer");
    if (outcomes.length > 0) {
        addTableSpacer();
        const outcomeRows = [
            new TableRow({
                children: [
                    new TableCell({
                        children: [new Paragraph({ children: [createRun("Course Outcomes:", true)], alignment: AlignmentType.LEFT })],
                        margins: cellMargins, width: { size: 10204, type: WidthType.DXA }
                    })
                ]
            }),
            new TableRow({
                children: [
                    new TableCell({
                        children: [new Paragraph({ children: [createRun("On completion of the course, students will be able to", false)], alignment: AlignmentType.LEFT })],
                        margins: cellMargins, width: { size: 10204, type: WidthType.DXA }
                    })
                ]
            })
        ];

        outcomes.forEach(out => {
            outcomeRows.push(new TableRow({
                children: [
                    new TableCell({
                        children: [new Paragraph({ children: [createRun(`●  ${cleanPrefix(out)}`, false)], alignment: AlignmentType.LEFT })],
                        margins: cellMargins, width: { size: 10204, type: WidthType.DXA }
                    })
                ]
            }));
        });

        docChildren.push(new Table({ width: { size: 10204, type: WidthType.DXA }, borders: tableBorders, rows: outcomeRows }));
    }

    // Text Books & Reference Books Table
    const textbooks = getListValues("textbooksContainer");
    const references = getListValues("referencesContainer");
    if (textbooks.length > 0 || references.length > 0) {
        addTableSpacer();
        const bookTableRows = [];
        if (textbooks.length > 0) {
            bookTableRows.push(new TableRow({
                children: [
                    new TableCell({
                        children: [new Paragraph({ children: [createRun("Text Books:", true)], alignment: AlignmentType.LEFT })],
                        columnSpan: 2, margins: cellMargins, width: { size: 10204, type: WidthType.DXA }
                    })
                ]
            }));
            textbooks.forEach((tb, idx) => {
                bookTableRows.push(new TableRow({
                    children: [
                        new TableCell({
                            children: [new Paragraph({ children: [createRun((idx + 1).toString(), true)], alignment: AlignmentType.CENTER })],
                            verticalAlign: VerticalAlign.CENTER, margins: cellMargins, width: { size: 567, type: WidthType.DXA }
                        }),
                        new TableCell({
                            children: [new Paragraph({ children: [createRun(cleanPrefix(tb), false)], alignment: AlignmentType.LEFT })],
                            verticalAlign: VerticalAlign.CENTER, margins: cellMargins, width: { size: 9637, type: WidthType.DXA }
                        })
                    ]
                }));
            });
        }

        if (references.length > 0) {
            bookTableRows.push(new TableRow({
                children: [
                    new TableCell({
                        children: [new Paragraph({ children: [createRun("Reference Books(s) / Web links:", true)], alignment: AlignmentType.LEFT })],
                        columnSpan: 2, margins: cellMargins, width: { size: 10204, type: WidthType.DXA }
                    })
                ]
            }));
            references.forEach((ref, idx) => {
                bookTableRows.push(new TableRow({
                    children: [
                        new TableCell({
                            children: [new Paragraph({ children: [createRun((idx + 1).toString(), true)], alignment: AlignmentType.CENTER })],
                            verticalAlign: VerticalAlign.CENTER, margins: cellMargins, width: { size: 567, type: WidthType.DXA }
                        }),
                        new TableCell({
                            children: [new Paragraph({ children: [createRun(cleanPrefix(ref), false)], alignment: AlignmentType.LEFT })],
                            verticalAlign: VerticalAlign.CENTER, margins: cellMargins, width: { size: 9637, type: WidthType.DXA }
                        })
                    ]
                }));
            });
        }

        docChildren.push(new Table({ width: { size: 10204, type: WidthType.DXA }, borders: tableBorders, rows: bookTableRows }));
    }

    const doc = new Document({
        documentDefaults: {
            run: { font: selectedFont, size: 24 },
            paragraph: { alignment: AlignmentType.JUSTIFIED, spacing: { before: 0, after: 120 } }
        },
        sections: [
            {
                properties: {
                    page: {
                        size: { width: 11906, height: 16838, orientation: PageOrientation ? PageOrientation.PORTRAIT : "portrait" },
                        margin: { top: 1440, bottom: 1440, left: 850, right: 850 }
                    }
                },
                children: docChildren
            }
        ]
    });

    const blob = await Packer.toBlob(doc);
    const downloadUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = `${subjectCode || "Course"}_Syllabus.docx`;
    
    document.body.appendChild(a);
    a.click();
    
    document.body.removeChild(a);
    URL.revokeObjectURL(downloadUrl);
}

// ==========================================================================
// EXPORT LIVE PREVIEW TO PDF / PRINT FUNCTION (CONTINUOUS FLOW FIX)
// ==========================================================================
function exportToPDF() {
    const previewEl = document.getElementById("documentPreview");
    if (!previewEl) {
        showToast("No live preview available to export.", "error");
        return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
        showToast("Please allow popups to export or print the PDF document.", "error");
        return;
    }

    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Curriculum Syllabus Document</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
                * { box-sizing: border-box; margin: 0; padding: 0; }
                body {
                    font-family: '${selectedFont}', 'Poppins', sans-serif;
                    padding: 15mm;
                    color: #000000;
                    background: #FFFFFF;
                    font-size: 11pt;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 14px;
                    page-break-inside: auto !important;
                    break-inside: auto !important;
                }
                tr {
                    page-break-inside: avoid !important;
                    break-inside: avoid !important;
                }
                th, td {
                    border: 1px solid #000000;
                    padding: 6px 10px;
                    font-size: 11pt;
                    line-height: 1.35;
                }
                th.section-title-cell, td.section-title-cell {
                    text-align: left !important;
                    font-weight: bold;
                    background-color: #F8FAFC;
                }
                td.subject-title-cell {
                    text-align: center !important;
                    font-weight: bold;
                }
                .unit-header-cell {
                    font-weight: bold;
                    text-transform: uppercase;
                    background-color: #F8FAFC;
                }
                @media print {
                    @page {
                        size: A4 portrait;
                        margin: 12mm 15mm;
                    }
                    body {
                        padding: 0;
                    }
                }
            </style>
        </head>
        <body>
            ${previewEl.innerHTML}
            <script>
                window.onload = function() {
                    window.print();
                    setTimeout(function() { window.close(); }, 750);
                };
            <\/script>
        </body>
        </html>
    `);
    printWindow.document.close();
}

// ==========================================================================
// RENDER LIVE DOCUMENT PREVIEW
// ==========================================================================
function renderLiveDocumentPreview() {
    const previewContainer = document.getElementById("documentPreview");
    const previewCard = document.getElementById("previewCard");
    if (!previewContainer) return;

    previewContainer.style.fontFamily = `'${selectedFont}', Poppins, sans-serif`;

    const courseType = courseTypeSelect ? courseTypeSelect.value : "Theory";
    const subjectCode = (document.getElementById("subjectCode")?.value || "").trim().toUpperCase();
    const subjectName = (document.getElementById("subjectName")?.value || "").trim();
    const category = (document.getElementById("category")?.value || "").trim();
    const lValue = document.getElementById("lValue")?.value || "0";
    const tValue = document.getElementById("tValue")?.value || "0";
    const pValue = document.getElementById("pValue")?.value || "0";
    const cValue = document.getElementById("cValue")?.value || "0";
    const branches = (document.getElementById("branches")?.value || "").trim();

    const objectives = getListValues("objectivesContainer");
    const outcomes = getListValues("outcomesContainer");
    const textbooks = getListValues("textbooksContainer");
    const references = getListValues("referencesContainer");
    const experiments = getListValues("experimentsContainer");

    let html = `
        <table>
            <tr>
                <th style="width: 20%;">Course Code</th>
                <th style="width: 45%;">Course Title</th>
                <th style="width: 15%;">Category</th>
                <th style="width: 5%;">L</th>
                <th style="width: 5%;">T</th>
                <th style="width: 5%;">P</th>
                <th style="width: 5%;">C</th>
            </tr>
            <tr>
                <td style="text-align: center;"><strong>${subjectCode || '---'}</strong></td>
                <td class="subject-title-cell"><strong>${subjectName || '---'}</strong></td>
                <td style="text-align: center;">${category || '---'}</td>
                <td style="text-align: center;">${lValue}</td>
                <td style="text-align: center;">${tValue}</td>
                <td style="text-align: center;">${pValue}</td>
                <td style="text-align: center;">${cValue}</td>
            </tr>
            ${branches ? `<tr><td colspan="7"><strong>Branches:</strong> ${branches}</td></tr>` : ''}
        </table>
    `;

    if (objectives.length > 0) {
        html += `
            <table>
                <tr><th class="section-title-cell">Objectives:</th></tr>
                ${objectives.map(o => `<tr><td>● ${cleanPrefix(o)}</td></tr>`).join('')}
            </table>
        `;
    }

    if (courseType === "Theory" || courseType === "Lab Oriented Theory") {
        html += `<table>`;
        let computedHrs = 0;
        for (let i = 1; i <= 5; i++) {
            const roman = getRomanNumeral(i);
            const uTitle = (document.getElementById(`unit${i}Title`)?.value || "").trim();
            const uHours = (document.getElementById(`unit${i}Hours`)?.value || "0").trim();
            const rawSyllabus = (document.getElementById(`unit${i}Syllabus`)?.value || "").trim();
            computedHrs += parseInt(uHours, 10) || 0;

            const cleanedSyllabus = rawSyllabus.split(/\r?\n/).map(l => l.trim()).filter(Boolean).join(" ").replace(/\s+/g, " ");

            html += `
                <tr class="unit-header-cell">
                    <td style="width: 15%;">UNIT-${roman}</td>
                    <td style="width: 70%;"><strong>${uTitle.toUpperCase()}</strong></td>
                    <td style="width: 15%; text-align: right;"><strong>${uHours}</strong></td>
                </tr>
                <tr>
                    <td colspan="3" style="text-align: justify; padding: 10px;">${cleanedSyllabus}</td>
                </tr>
            `;
        }
        html += `
            <tr>
                <td colspan="3"><strong>Total Contact Hours: ${computedHrs}</strong></td>
            </tr>
        </table>`;
    }

    if ((courseType === "Lab" || courseType === "Lab Oriented Theory") && experiments.length > 0) {
        html += `
            <table>
                <tr><th colspan="2" class="section-title-cell">LIST OF EXPERIMENTS</th></tr>
                ${experiments.map((e, idx) => `<tr><td style="width: 8%; text-align: center;">${idx + 1}</td><td>${cleanPrefix(e)}</td></tr>`).join('')}
            </table>
        `;
    }

    if (outcomes.length > 0) {
        html += `
            <table>
                <tr><th class="section-title-cell">Course Outcomes:</th></tr>
                <tr><td><em>On completion of the course, students will be able to</em></td></tr>
                ${outcomes.map(o => `<tr><td>● ${cleanPrefix(o)}</td></tr>`).join('')}
            </table>
        `;
    }

    if (textbooks.length > 0 || references.length > 0) {
        html += `<table>`;
        if (textbooks.length > 0) {
            html += `<tr><th colspan="2" class="section-title-cell">Text Books:</th></tr>`;
            html += textbooks.map((tb, idx) => `<tr><td style="width: 8%; text-align: center;">${idx + 1}</td><td>${cleanPrefix(tb)}</td></tr>`).join('');
        }
        if (references.length > 0) {
            html += `<tr><th colspan="2" class="section-title-cell">Reference Book(s) / Web links:</th></tr>`;
            html += references.map((rf, idx) => `<tr><td style="width: 8%; text-align: center;">${idx + 1}</td><td>${cleanPrefix(rf)}</td></tr>`).join('');
        }
        html += `</table>`;
    }

    previewContainer.innerHTML = html;
    if (previewCard) previewCard.classList.remove("hidden");
}

// ==========================================================================
// EXCEL EXPORT & IMPORT UTILITIES
// ==========================================================================
function downloadExcelTemplate() {
    if (!window.XLSX) {
        showToast("Excel generator library is not loaded. Check internet connection.", "error");
        return;
    }

    const courseType = courseTypeSelect ? courseTypeSelect.value : "Theory";
    const data = [
        ["Field Name", "Value"],
        ["Course Type", courseType],
        ["Subject Code", "HS19151"],
        ["Subject Name", "TECHNICAL ENGLISH"],
        ["Category", "HS"],
        ["L", "2"],
        ["T", "1"],
        ["P", "0"],
        ["C", "3"],
        ["Branch(es)", "Common to All Branches"],
        ["Course Objectives", "To enable learners to acquire basic proficiency in English reading and listening.\nTo write in English precisely and effectively.\nTo speak flawlessly in all kinds of communicative contexts."]
    ];

    for (let i = 1; i <= 5; i++) {
        const roman = getRomanNumeral(i);
        data.push([`Unit ${roman} Title`, `UNIT ${roman} TITLE`]);
        data.push([`Unit ${roman} Contact Hours`, "9"]);
        data.push([`Unit ${roman} Syllabus`, "Syllabus topic details..."]);
    }

    data.push(["Course Outcomes", "Discuss and respond to listening content.\nRead and comprehend different texts."]);
    data.push(["Text Books", "Orient BlackSwan Publications, English for Technologists & Engineers, 2012."]);
    data.push(["Reference Books / Web links", "Meenakshi Raman & Sangeeta Sharma, Technical Communication."]);

    const ws = XLSX.utils.aoa_to_sheet(data);
    ws["!cols"] = [{ wch: 30 }, { wch: 80 }];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Syllabus Details");
    
    XLSX.writeFile(wb, `${courseType}_Syllabus_Template.xlsx`);
}

function handleExcelUpload(event) {
    if (!window.XLSX) {
        showToast("Excel reader library is not loaded.", "error");
        return;
    }

    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            
            if (workbook.SheetNames.length === 0) {
                throw new Error("No worksheets found in Excel file.");
            }
            
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            const fieldMap = {};
            jsonData.forEach(row => {
                if (row && row[0] !== undefined) {
                    const key = row[0].toString().trim();
                    const val = row[1] !== undefined && row[1] !== null ? row[1].toString().trim() : "";
                    const normKey = key.toLowerCase().replace(/[^a-z0-9]/g, "");
                    fieldMap[normKey] = val;
                }
            });

            if (fieldMap["coursetype"]) {
                const type = fieldMap["coursetype"];
                if (["Theory", "Lab", "Lab Oriented Theory"].includes(type)) {
                    if (courseTypeSelect) courseTypeSelect.value = type;
                    handleCourseTypeChange();
                }
            }

            const inputMappings = {
                "subjectcode": "subjectCode",
                "subjectname": "subjectName",
                "category": "category",
                "l": "lValue",
                "t": "tValue",
                "p": "pValue",
                "c": "cValue",
                "branches": "branches"
            };

            for (const [normKey, elementId] of Object.entries(inputMappings)) {
                if (fieldMap[normKey] !== undefined) {
                    const el = document.getElementById(elementId);
                    if (el) {
                        el.value = fieldMap[normKey];
                        el.dispatchEvent(new Event("input"));
                    }
                }
            }

            for (let i = 1; i <= 5; i++) {
                const roman = getRomanNumeral(i).toLowerCase();
                const titleKey = `unit${roman}title`;
                if (fieldMap[titleKey] !== undefined) {
                    const el = document.getElementById(`unit${i}Title`);
                    if (el) el.value = fieldMap[titleKey];
                }
                const hourKey = `unit${roman}contacthours`;
                if (fieldMap[hourKey] !== undefined) {
                    const el = document.getElementById(`unit${i}Hours`);
                    if (el) el.value = fieldMap[hourKey];
                }
                const syllabusKey = `unit${roman}syllabus`;
                if (fieldMap[syllabusKey] !== undefined) {
                    const el = document.getElementById(`unit${i}Syllabus`);
                    if (el) el.value = fieldMap[syllabusKey];
                }
            }

            const listMappings = [
                { keys: ["courseobjectives", "objectives"], containerId: "objectivesContainer", addBtnId: "addObjectiveBtn" },
                { keys: ["listofexperiments", "experiments"], containerId: "experimentsContainer", addBtnId: "addExperimentBtn" },
                { keys: ["courseoutcomes", "outcomes"], containerId: "outcomesContainer", addBtnId: "addOutcomeBtn" },
                { keys: ["suggestedevaluationmethods", "evaluations"], containerId: "evaluationsContainer", addBtnId: "addEvaluationBtn" },
                { keys: ["suggestedactivities", "activities"], containerId: "activitiesContainer", addBtnId: "addActivityBtn" },
                { keys: ["textbooks", "textbook"], containerId: "textbooksContainer", addBtnId: "addTextbookBtn" },
                { keys: ["referencebooksweblinks", "references"], containerId: "referencesContainer", addBtnId: "addReferenceBtn" }
            ];

            listMappings.forEach(mapping => {
                let listData = null;
                for (const k of mapping.keys) {
                    if (fieldMap[k] !== undefined) {
                        listData = fieldMap[k];
                        break;
                    }
                }
                if (listData !== null) {
                    const lines = listData.split(/\r?\n/).map(line => cleanPrefix(line)).filter(Boolean);
                    setDynamicListValues(mapping.containerId, mapping.addBtnId, lines);
                }
            });

            calculateTotalHours();
            renderLiveDocumentPreview();
            showToast("Excel spreadsheet successfully imported!", "success");
        } catch (err) {
            console.error("Excel processing failure:", err);
            showToast(`Failed to parse Excel file: ${err.message}`, "error");
        } finally {
            event.target.value = "";
        }
    };
    reader.readAsArrayBuffer(file);
}

// ==========================================================================
// UNIVERSAL MULTI-FORMAT HEURISTIC PARSER ENGINE
// ==========================================================================
function parseFullSyllabusText() {
    try {
        const pasteEl = document.getElementById("quickPasteArea");
        const text = pasteEl ? pasteEl.value.trim() : "";
        if (!text) {
            showToast("Please paste syllabus content first.", "error");
            return;
        }

        const lines = text.split(/\r?\n/).map(l => l.trim());
        
        let subjectCode = "";
        let subjectName = "";
        let category = "";
        let l = "0", t = "0", p = "0", c = "0";
        let branches = "";
        
        let objectives = [];
        let experiments = [];
        let outcomes = [];
        let evaluations = [];
        let activities = [];
        let textbooks = [];
        let references = [];
        
        let units = [
            { title: "", hours: "0", syllabus: [] },
            { title: "", hours: "0", syllabus: [] },
            { title: "", hours: "0", syllabus: [] },
            { title: "", hours: "0", syllabus: [] },
            { title: "", hours: "0", syllabus: [] }
        ];

        let currentSection = "";

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (!line) continue;

            const tabCells = line.split(/\t+/).map(s => s.trim()).filter(Boolean);
            if (tabCells.length >= 5) {
                const firstCell = tabCells[0];
                if (/^[A-Za-z0-9\-]{3,10}$/.test(firstCell) && !firstCell.toLowerCase().includes("subject")) {
                    subjectCode = tabCells[0];
                    subjectName = tabCells[1].replace(/\s*\(Theory course\)/i, "");
                    category = tabCells[2];
                    l = tabCells[3];
                    t = tabCells[4];
                    p = tabCells[5] || "0";
                    c = tabCells[6] || "0";
                    break;
                }
            }

            if (line.toLowerCase().includes("subject code") && line.includes("\t")) {
                let nextIdx = i + 1;
                while (nextIdx < lines.length && !lines[nextIdx]) nextIdx++;
                if (nextIdx < lines.length) {
                    const valCells = lines[nextIdx].split(/\t+/).map(s => s.trim()).filter(Boolean);
                    if (valCells.length >= 4) {
                        subjectCode = valCells[0];
                        subjectName = valCells[1].replace(/\s*\(Theory course\)/i, "");
                        category = valCells[2];
                        l = valCells[3];
                        t = valCells[4] || "0";
                        p = valCells[5] || "0";
                        c = valCells[6] || "0";
                        break;
                    }
                }
            }
        }

        if (!subjectCode) {
            for (let i = 0; i < lines.length - 10; i++) {
                if (lines[i].toLowerCase().includes("subject code") &&
                    lines[i+1].toLowerCase().includes("subject name") &&
                    lines[i+2].toLowerCase().includes("category")) {
                    
                    let valueIdx = i + 3;
                    while (valueIdx < lines.length && (lines[valueIdx].toUpperCase() === "L" || lines[valueIdx].toUpperCase() === "T" || lines[valueIdx].toUpperCase() === "P" || lines[valueIdx].toUpperCase() === "C")) {
                        valueIdx++;
                    }

                    if (valueIdx + 6 < lines.length) {
                        subjectCode = lines[valueIdx];
                        subjectName = lines[valueIdx + 1].replace(/\s*\(Theory course\)/i, "");
                        category = lines[valueIdx + 2];
                        l = lines[valueIdx + 3];
                        t = lines[valueIdx + 4];
                        p = lines[valueIdx + 5];
                        c = lines[valueIdx + 6];
                    }
                    break;
                }
            }
        }

        if (!subjectCode) {
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                if (!line) continue;

                const codeMatch = line.match(/(?:Subject\s*Code|Course\s*Code|Code)\s*[\:\-\t]+\s*([A-Za-z0-9\-]+)/i);
                if (codeMatch && !subjectCode) subjectCode = codeMatch[1].trim();

                const titleMatch = line.match(/(?:Subject\s*Name|Course\s*Title|Title)\s*[\:\-\t]+\s*(.+)/i);
                if (titleMatch && !subjectName) subjectName = titleMatch[1].trim();

                const catMatch = line.match(/(?:Category)\s*[\:\-\t]+\s*([A-Za-z0-9]+)/i);
                if (catMatch && !category) category = catMatch[1].trim();

                const branchMatch = line.match(/(?:Branch|Department|Branches|Common to)\s*[\:\-\t]+\s*(.+)/i);
                if (branchMatch && !branches) branches = branchMatch[1].trim();

                const ltpcMatch = line.match(/L\s*[\:\=]?\s*(\d+)\s*T\s*[\:\=]?\s*(\d+)\s*P\s*[\:\=]?\s*(\d+)\s*C\s*[\:\=]?\s*(\d+)/i) ||
                                  line.match(/(\d+)[\-\s]+(\d+)[\-\s]+(\d+)[\-\s]+(\d+)\s*credits?/i);
                if (ltpcMatch) {
                    l = ltpcMatch[1]; t = ltpcMatch[2]; p = ltpcMatch[3]; c = ltpcMatch[4];
                }
            }
        }

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (!line) continue;
            const lower = line.toLowerCase();

            if (lower.startsWith("co - po") || lower.startsWith("co-po") || lower.includes("matrices of course") || lower.includes("correlation levels")) {
                break;
            }

            if (lower === "subject code" || lower.startsWith("subject name") || lower === "category" || lower === "l" || lower === "t" || lower === "p" || lower === "c") {
                continue;
            }

            if (line.includes("\t") && lower.includes("subject code")) {
                continue;
            }
            if (subjectCode && line.includes(subjectCode)) {
                continue;
            }

            if (/^\s*(?:course\s*)?objectives?\s*[\:\-]?\s*$/i.test(line) || lower.startsWith("objectives:")) {
                currentSection = "objectives";
                continue;
            }

            if (/^\s*(?:course\s*)?outcomes?\s*[\:\-]?\s*$/i.test(line) || lower.startsWith("course outcomes:")) {
                currentSection = "outcomes";
                continue;
            }

            if (/^\s*(?:list of\s*)?experiments?\s*[\:\-]?\s*$/i.test(line) || lower.startsWith("list of experiments")) {
                currentSection = "experiments";
                continue;
            }

            if (/^\s*text\s*book\(?s?\)?\s*[\:\-]?\s*$/i.test(line) || lower.startsWith("text book")) {
                currentSection = "textbooks";
                continue;
            }

            if (/^\s*reference\s*book\(?s?\)?\s*(?:\/\s*web\s*links)?\s*[\:\-]?\s*$/i.test(line) || lower.startsWith("reference book")) {
                currentSection = "references";
                continue;
            }

            if (lower.startsWith("total contact hours")) {
                continue;
            }

            const unitMatch = line.match(/^\s*(?:UNIT|MODULE)[\-–—:\s]*([I|V|X\d]+|\d+)\b(.*)$/i);
            if (unitMatch) {
                const unitNum = parseRomanOrNumber(unitMatch[1]);
                if (unitNum >= 1 && unitNum <= 5) {
                    currentSection = `unit${unitNum}`;
                    let remainder = unitMatch[2].trim();
                    let title = "";
                    let hours = "0";

                    if (remainder.includes("\t")) {
                        const parts = remainder.split(/\t+/).map(s => s.trim()).filter(Boolean);
                        if (parts.length >= 2) {
                            title = parts[0];
                            hours = parts[1];
                        } else if (parts.length === 1) {
                            if (/^\d+$/.test(parts[0])) hours = parts[0];
                            else title = parts[0];
                        }
                    } else if (remainder) {
                        const hMatch = remainder.match(/(.*?)(?:(\d+)\s*(?:hours?|hrs?|periods?|\)?)\s*)$/i);
                        if (hMatch && hMatch[1].trim()) {
                            title = hMatch[1].replace(/[\:–—\-]+$/, "").trim();
                            hours = hMatch[2];
                        } else {
                            title = remainder.replace(/[\:–—\-]+$/, "").trim();
                        }
                    }

                    if (!title && i + 1 < lines.length && !lines[i + 1].match(/^\d+$/) && !lines[i + 1].toLowerCase().startsWith("unit")) {
                        i++;
                        title = lines[i];
                    }

                    if (i + 1 < lines.length && lines[i + 1].match(/^\d+$/)) {
                        i++;
                        hours = lines[i];
                    }

                    units[unitNum - 1].title = title;
                    units[unitNum - 1].hours = hours;
                    continue;
                }
            }

            if (line === ":" || /^\d+$/.test(line)) {
                continue;
            }

            const cleaned = cleanPrefix(line);
            if (!cleaned || cleaned.toLowerCase().startsWith("on completion of the course")) continue;

            if (currentSection === "objectives") {
                objectives.push(cleaned);
            } else if (currentSection === "outcomes") {
                outcomes.push(cleaned);
            } else if (currentSection === "experiments") {
                experiments.push(cleaned);
            } else if (currentSection === "textbooks") {
                textbooks.push(cleaned);
            } else if (currentSection === "references") {
                references.push(cleaned);
            } else if (currentSection.startsWith("unit")) {
                const idx = parseInt(currentSection.replace("unit", ""), 10) - 1;
                if (idx >= 0 && idx < 5) {
                    units[idx].syllabus.push(line);
                }
            }
        }

        const elCode = document.getElementById("subjectCode");
        const elName = document.getElementById("subjectName");
        const elCat = document.getElementById("category");
        const elL = document.getElementById("lValue");
        const elT = document.getElementById("tValue");
        const elP = document.getElementById("pValue");
        const elC = document.getElementById("cValue");
        const elBranches = document.getElementById("branches");

        if (elCode && subjectCode) elCode.value = subjectCode;
        if (elName && subjectName) elName.value = subjectName;
        if (elCat && category) elCat.value = category;
        if (elL) elL.value = l;
        if (elT) elT.value = t;
        if (elP) elP.value = p;
        if (elC) elC.value = c;
        
        if (elBranches) {
            if (branches) {
                elBranches.value = branches;
            } else if (!elBranches.value.trim()) {
                elBranches.value = "Common to All Branches";
            }
        }

        let detectedType = "Theory";
        if (parseInt(l, 10) > 0 && parseInt(p, 10) > 0) detectedType = "Lab Oriented Theory";
        else if (parseInt(l, 10) === 0 && parseInt(p, 10) > 0) detectedType = "Lab";
        
        if (courseTypeSelect) {
            courseTypeSelect.value = detectedType;
            handleCourseTypeChange();
        }

        let filledUnits = 0;
        for (let i = 1; i <= 5; i++) {
            const u = units[i - 1];
            const titleInput = document.getElementById(`unit${i}Title`);
            const hoursInput = document.getElementById(`unit${i}Hours`);
            const syllabusTextarea = document.getElementById(`unit${i}Syllabus`);
            
            if (u.title && titleInput) {
                titleInput.value = cleanPrefix(u.title);
                filledUnits++;
            }
            if (u.hours && hoursInput) {
                hoursInput.value = u.hours;
            }
            if (u.syllabus.length > 0 && syllabusTextarea) {
                const cleanedSyllabus = u.syllabus.join(" ").replace(/\s+/g, " ").trim();
                syllabusTextarea.value = cleanedSyllabus;
            }
        }

        if (objectives.length > 0) setDynamicListValues("objectivesContainer", "addObjectiveBtn", objectives);
        if (experiments.length > 0) setDynamicListValues("experimentsContainer", "addExperimentBtn", experiments);
        if (outcomes.length > 0) setDynamicListValues("outcomesContainer", "addOutcomeBtn", outcomes);
        if (textbooks.length > 0) setDynamicListValues("textbooksContainer", "addTextbookBtn", textbooks);
        if (references.length > 0) setDynamicListValues("referencesContainer", "addReferenceBtn", references);

        calculateTotalHours();
        renderLiveDocumentPreview();

        const parserFeedback = document.getElementById("parserFeedback");
        const feedbackStats = document.getElementById("feedbackStats");
        if (parserFeedback && feedbackStats) {
            feedbackStats.innerHTML = `
                <span class="stat-chip">Subject Code: <strong>${subjectCode || '---'}</strong></span>
                <span class="stat-chip">Subject Name: <strong>${subjectName || '---'}</strong></span>
                <span class="stat-chip">Credits: <strong>${l}-${t}-${p}-${c}</strong></span>
                <span class="stat-chip">Branches: <strong>${elBranches ? elBranches.value : 'Common to All'}</strong></span>
                <span class="stat-chip">Units Extracted: <strong>${filledUnits}/5</strong></span>
                <span class="stat-chip">Objectives: <strong>${objectives.length}</strong></span>
                <span class="stat-chip">Outcomes: <strong>${outcomes.length}</strong></span>
                <span class="stat-chip">Textbooks: <strong>${textbooks.length}</strong></span>
                <span class="stat-chip">References: <strong>${references.length}</strong></span>
            `;
            parserFeedback.classList.remove("hidden");
        }

        showToast(`Parsed syllabus fields successfully!`, "success");
    } catch (err) {
        console.error("Syllabus parser error:", err);
        showToast(`Failed to parse text: ${err.message}`, "error");
    }
}

// ==========================================================================
// INITIALIZATION
// ==========================================================================
document.addEventListener("DOMContentLoaded", () => {
    initSettingsModal();

    initDynamicList("objectivesContainer", "addObjectiveBtn", "removeObjectiveBtn", "e.g. Understand memory representation of data structures.", true);
    initDynamicList("experimentsContainer", "addExperimentBtn", "removeExperimentBtn", "e.g. Implement Stack operations using array.", true);
    initDynamicList("outcomesContainer", "addOutcomeBtn", "removeOutcomeBtn", "e.g. Design and evaluate recursive algorithms for tree traversal.", true);
    initDynamicList("textbooksContainer", "addTextbookBtn", "removeTextbookBtn", "e.g. Orient BlackSwan, English for Technologists & Engineers.", true);
    initDynamicList("referencesContainer", "addReferenceBtn", "removeReferenceBtn", "e.g. Meenakshi Raman & Sangeeta Sharma, Technical Communication.", true);
    initDynamicList("activitiesContainer", "addActivityBtn", "removeActivityBtn", "e.g. Peer review of flowchart representations.", false);
    initDynamicList("evaluationsContainer", "addEvaluationBtn", "removeEvaluationBtn", "e.g. Bi-weekly MCQ quizzes on theoretical bounds.", false);

    handleCourseTypeChange();

    const downloadTemplateBtn = document.getElementById("downloadTemplateBtn");
    const excelUpload = document.getElementById("excelUpload");
    if (downloadTemplateBtn) downloadTemplateBtn.addEventListener("click", downloadExcelTemplate);
    if (excelUpload) excelUpload.addEventListener("change", handleExcelUpload);

    const btnQuickParse = document.getElementById("btnQuickParse");
    if (btnQuickParse) btnQuickParse.addEventListener("click", parseFullSyllabusText);

    const btnPreviewDownload = document.getElementById("btnPreviewDownload");
    if (btnPreviewDownload) btnPreviewDownload.addEventListener("click", generateWordDocument);

    const btnExportPDF = document.getElementById("btnExportPDF");
    if (btnExportPDF) btnExportPDF.addEventListener("click", exportToPDF);

    const formEl = document.getElementById("syllabusForm");
    if (formEl) {
        renderLiveDocumentPreview();
    }
});
