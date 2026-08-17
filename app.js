// ==========================================================================
// TOAST NOTIFICATION UTILITY
// ==========================================================================
const toast = document.getElementById("toast");
let toastTimeout;

function showToast(message, type = "success") {
    clearTimeout(toastTimeout);
    
    toast.textContent = message;
    toast.className = `toast show ${type}`;
    
    toastTimeout = setTimeout(() => {
        toast.className = "toast hidden";
    }, 4000);
}

// ==========================================================================
// ROMAN NUMERAL CONVERTER HELPER
// ==========================================================================
function getRomanNumeral(num) {
    const romans = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
    return romans[num - 1] || num.toString();
}

// ==========================================================================
// DYNAMIC INPUT LIST BUILDER
// ==========================================================================
function initDynamicList(containerId, addBtnId, removeBtnId, placeholder, required = true) {
    const container = document.getElementById(containerId);
    const addBtn = document.getElementById(addBtnId);
    const removeBtn = document.getElementById(removeBtnId);

    // Clean line helper: Strips leading list characters (e.g., "1.", "●", "•", "-", "*") and spaces
    function cleanImportLine(line) {
        return line.trim().replace(/^(\d+[\.\)\s\t]+|●|•|-|\*)\s*/, "").trim();
    }

    // Dynamic Bulk Import UI generation - Always visible textbox
    const bulkWrap = document.createElement("div");
    bulkWrap.className = "bulk-import-wrap";
    bulkWrap.style.marginTop = "0.75rem";
    
    const bulkTextarea = document.createElement("textarea");
    bulkTextarea.className = "bulk-textarea";
    bulkTextarea.rows = 2;
    bulkTextarea.placeholder = "⚡ Paste list here to auto-detect and add multiple rows instantly...";
    
    const bulkActions = document.createElement("div");
    bulkActions.className = "button-group flex-end";
    bulkActions.style.marginTop = "0.5rem";
    
    const importBtn = document.createElement("button");
    importBtn.type = "button";
    importBtn.className = "btn btn-secondary";
    importBtn.style.padding = "0.25rem 0.75rem";
    importBtn.style.fontSize = "0.85rem";
    importBtn.textContent = "Detect & Import";
    
    bulkActions.appendChild(importBtn);
    bulkWrap.appendChild(bulkTextarea);
    bulkWrap.appendChild(bulkActions);
    
    // Inject immediately after the dynamic container
    container.after(bulkWrap);

    const processPasteText = () => {
        const text = bulkTextarea.value.trim();
        if (text) {
            const lines = text.split(/\r?\n/).map(line => cleanImportLine(line)).filter(line => line.length > 0);
            if (lines.length > 0) {
                // If there's only one empty input, overwrite it
                const firstRowInput = container.querySelector(".row-input");
                let startIndex = 0;
                if (container.children.length === 1 && firstRowInput && firstRowInput.value.trim() === "") {
                    firstRowInput.value = lines[0];
                    firstRowInput.classList.remove("invalid");
                    const err = firstRowInput.parentElement.querySelector(".error-message");
                    if (err) err.remove();
                    startIndex = 1;
                }
                
                for (let i = startIndex; i < lines.length; i++) {
                    createRow(lines[i]);
                }
                
                updateRowNumbers();
                showToast(`Auto-detected and imported ${lines.length} items!`, "success");
            }
            bulkTextarea.value = "";
        }
    };

    // Auto-process on paste
    bulkTextarea.addEventListener("paste", () => {
        setTimeout(processPasteText, 10);
    });

    // Process on button click
    importBtn.onclick = processPasteText;

    function createRow(value = "") {
        const rowCount = container.children.length + 1;
        const row = document.createElement("div");
        row.className = "dynamic-row";
        
        const numSpan = document.createElement("span");
        numSpan.className = "row-num";
        numSpan.textContent = rowCount + ".";

        const input = document.createElement("input");
        input.type = "text";
        input.className = "row-input";
        input.placeholder = placeholder;
        input.value = value;
        
        // Custom validations
        if (required) {
            input.setAttribute("required", "required");
        }

        // Auto-detect when pasting directly in the input box
        input.addEventListener("paste", (e) => {
            const pastedText = (e.clipboardData || window.clipboardData).getData("text");
            if (pastedText.includes("\n") || pastedText.includes("\r")) {
                e.preventDefault();
                
                const lines = pastedText.split(/\r?\n/).map(line => cleanImportLine(line)).filter(line => line.length > 0);
                if (lines.length > 0) {
                    input.value = lines[0];
                    input.classList.remove("invalid");
                    const err = row.querySelector(".error-message");
                    if (err) err.remove();
                    
                    for (let i = 1; i < lines.length; i++) {
                        createRow(lines[i]);
                    }
                    updateRowNumbers();
                    showToast(`Auto-detected and added ${lines.length} items!`, "success");
                }
            }
        });

        input.addEventListener("input", () => {
            if (input.value.trim() !== "") {
                input.classList.remove("invalid");
                const errorSpan = row.querySelector(".error-message");
                if (errorSpan) errorSpan.remove();
            }
        });

        // Row delete button (Premium UX)
        const deleteBtn = document.createElement("button");
        deleteBtn.type = "button";
        deleteBtn.className = "btn-row-remove";
        deleteBtn.innerHTML = "&times;";
        deleteBtn.title = "Delete this row";
        deleteBtn.onclick = () => {
            if (container.children.length > 1) {
                row.remove();
                updateRowNumbers();
            } else {
                showToast("Cannot remove the last item. You can clear its content if it is optional.", "error");
            }
        };

        row.appendChild(numSpan);
        row.appendChild(input);
        row.appendChild(deleteBtn);
        container.appendChild(row);
    }

    function updateRowNumbers() {
        Array.from(container.children).forEach((child, index) => {
            child.querySelector(".row-num").textContent = (index + 1) + ".";
        });
    }

    addBtn.addEventListener("click", () => {
        createRow();
    });

    removeBtn.addEventListener("click", () => {
        if (container.children.length > 1) {
            container.lastElementChild.remove();
        } else {
            showToast("At least one entry is required in this list.", "error");
        }
    });

    // Populate initial row
    createRow();
}

// Get non-empty array of values from a dynamic list
function getListValues(containerId) {
    const container = document.getElementById(containerId);
    const inputs = container.querySelectorAll(".row-input");
    const values = [];
    inputs.forEach(input => {
        const val = input.value.trim();
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
    const inputs = container.querySelectorAll("input, textarea, select");
    inputs.forEach(input => {
        if (enable) {
            input.removeAttribute("disabled");
            // If it's a dynamic list row, make sure it's required only if it belongs to a required list
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
    const type = courseTypeSelect.value;
    
    if (type === "Theory") {
        theorySection.classList.remove("hidden");
        labSection.classList.add("hidden");
        
        toggleInputs(theorySection, true);
        toggleInputs(labSection, false);
    } else if (type === "Lab") {
        theorySection.classList.add("hidden");
        labSection.classList.remove("hidden");
        
        toggleInputs(theorySection, false);
        toggleInputs(labSection, true);
    } else if (type === "Lab Oriented Theory") {
        theorySection.classList.remove("hidden");
        labSection.classList.remove("hidden");
        
        toggleInputs(theorySection, true);
        toggleInputs(labSection, true);
    }
    
    calculateTotalHours();
}

function calculateTotalHours() {
    let total = 0;
    hoursInputs.forEach(input => {
        if (!input.disabled) {
            const val = parseFloat(input.value) || 0;
            total += val;
        }
    });
    totalHoursVal.textContent = total;
}

// Bind live changes
courseTypeSelect.addEventListener("change", handleCourseTypeChange);

hoursInputs.forEach(input => {
    input.addEventListener("input", calculateTotalHours);
});

// Input validation styles
document.querySelectorAll("input, textarea, select").forEach(el => {
    el.addEventListener("input", () => {
        if (el.checkValidity()) {
            el.classList.remove("invalid");
            const error = el.parentElement.querySelector(".error-message");
            if (error) error.remove();
        }
    });
});

// ==========================================================================
// FORM SUBMIT & DOCX GENERATION LOGIC
// ==========================================================================
const form = document.getElementById("syllabusForm");
const validationBanner = document.getElementById("validationBanner");
const generateDocBtn = document.getElementById("generateDocBtn");

form.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    // Perform manual validation check
    let isValid = true;
    const inputs = form.querySelectorAll("input, textarea, select");
    
    // Clear previous errors
    document.querySelectorAll(".error-message").forEach(el => el.remove());
    inputs.forEach(el => el.classList.remove("invalid"));
    
    inputs.forEach(input => {
        if (!input.disabled && !input.checkValidity()) {
            isValid = false;
            input.classList.add("invalid");
            
            // Add clean error message under the element
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
        
        // Scroll first invalid item into view smoothly
        const firstInvalid = form.querySelector(".invalid");
        if (firstInvalid) {
            firstInvalid.scrollIntoView({ behavior: "smooth", block: "center" });
            firstInvalid.focus();
        }
        return;
    }
    
    validationBanner.classList.add("hidden");
    
    // Toggle loading state
    generateDocBtn.disabled = true;
    generateDocBtn.querySelector(".btn-text").textContent = "Generating...";
    generateDocBtn.querySelector(".btn-spinner").classList.remove("hidden");
    
    try {
        await generateWordDocument();
        showToast("Syllabus DOCX generated successfully!", "success");
    } catch (err) {
        console.error("DOCX generation error:", err);
        showToast(`Failed to generate document: ${err.message}`, "error");
    } finally {
        generateDocBtn.disabled = false;
        generateDocBtn.querySelector(".btn-text").textContent = "Generate DOCX";
        generateDocBtn.querySelector(".btn-spinner").classList.add("hidden");
    }
});

// ==========================================================================
// DOCX COMPILATION USING DOCX.JS
// ==========================================================================
async function generateWordDocument() {
    if (!window.docx) {
        throw new Error("Word document generation library (docx.js) could not be loaded. Please check your internet connection.");
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

    // Fetch form details
    const courseType = courseTypeSelect.value;
    const subjectCode = document.getElementById("subjectCode").value.trim().toUpperCase();
    const subjectName = document.getElementById("subjectName").value.trim();
    const category = document.getElementById("category").value.trim();
    const lValue = document.getElementById("lValue").value;
    const tValue = document.getElementById("tValue").value;
    const pValue = document.getElementById("pValue").value;
    const cValue = document.getElementById("cValue").value;
    const branches = document.getElementById("branches").value.trim();

    // Table cell padding (margins): 120 dxa (6pt) top/bottom, 144 dxa (7.2pt) left/right
    const cellMargins = {
        top: 120,
        bottom: 120,
        left: 144,
        right: 144
    };

    // Table border configuration: Thin black borders
    const tableBorders = {
        top: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
        bottom: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
        left: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
        right: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
        insideVertical: { style: BorderStyle.SINGLE, size: 4, color: "000000" }
    };

    const docChildren = [];

    // Table 1: Course Details Table (Total width 18cm = 10204 dxa)
    // Code=3.0cm(1701 dxa), Title=8.5cm(4818 dxa), Cat=2.5cm(1417 dxa), L=1.0cm(567 dxa), T=1.0cm(567 dxa), P=1.0cm(567 dxa), C=1.0cm(567 dxa)
    const basicInfoTable = new Table({
        width: { size: 10204, type: WidthType.DXA },
        borders: tableBorders,
        rows: [
            // Row 1: Headers (Center aligned, Bold, 12pt)
            new TableRow({
                children: [
                    new TableCell({
                        children: [new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [new TextRun({ text: "Course Code", bold: true, size: 24 })],
                            spacing: { before: 0, after: 0 }
                        })],
                        verticalAlign: VerticalAlign.CENTER,
                        margins: cellMargins,
                        width: { size: 1701, type: WidthType.DXA }
                    }),
                    new TableCell({
                        children: [new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [new TextRun({ text: "Course Title", bold: true, size: 24 })],
                            spacing: { before: 0, after: 0 }
                        })],
                        verticalAlign: VerticalAlign.CENTER,
                        margins: cellMargins,
                        width: { size: 4818, type: WidthType.DXA }
                    }),
                    new TableCell({
                        children: [new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [new TextRun({ text: "Category", bold: true, size: 24 })],
                            spacing: { before: 0, after: 0 }
                        })],
                        verticalAlign: VerticalAlign.CENTER,
                        margins: cellMargins,
                        width: { size: 1417, type: WidthType.DXA }
                    }),
                    new TableCell({
                        children: [new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [new TextRun({ text: "L", bold: true, size: 24 })],
                            spacing: { before: 0, after: 0 }
                        })],
                        verticalAlign: VerticalAlign.CENTER,
                        margins: cellMargins,
                        width: { size: 567, type: WidthType.DXA }
                    }),
                    new TableCell({
                        children: [new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [new TextRun({ text: "T", bold: true, size: 24 })],
                            spacing: { before: 0, after: 0 }
                        })],
                        verticalAlign: VerticalAlign.CENTER,
                        margins: cellMargins,
                        width: { size: 567, type: WidthType.DXA }
                    }),
                    new TableCell({
                        children: [new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [new TextRun({ text: "P", bold: true, size: 24 })],
                            spacing: { before: 0, after: 0 }
                        })],
                        verticalAlign: VerticalAlign.CENTER,
                        margins: cellMargins,
                        width: { size: 567, type: WidthType.DXA }
                    }),
                    new TableCell({
                        children: [new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [new TextRun({ text: "C", bold: true, size: 24 })],
                            spacing: { before: 0, after: 0 }
                        })],
                        verticalAlign: VerticalAlign.CENTER,
                        margins: cellMargins,
                        width: { size: 567, type: WidthType.DXA }
                    })
                ]
            }),
            // Row 2: User Inputs (Vertically centered text, 12pt)
            new TableRow({
                children: [
                    new TableCell({
                        children: [new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [new TextRun({ text: subjectCode, size: 24 })],
                            spacing: { before: 0, after: 0 }
                        })],
                        verticalAlign: VerticalAlign.CENTER,
                        margins: cellMargins,
                        width: { size: 1701, type: WidthType.DXA }
                    }),
                    new TableCell({
                        children: [new Paragraph({
                            alignment: AlignmentType.LEFT,
                            children: [new TextRun({ text: subjectName, size: 24 })],
                            spacing: { before: 0, after: 0 }
                        })],
                        verticalAlign: VerticalAlign.CENTER,
                        margins: cellMargins,
                        width: { size: 4818, type: WidthType.DXA }
                    }),
                    new TableCell({
                        children: [new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [new TextRun({ text: category, size: 24 })],
                            spacing: { before: 0, after: 0 }
                        })],
                        verticalAlign: VerticalAlign.CENTER,
                        margins: cellMargins,
                        width: { size: 1417, type: WidthType.DXA }
                    }),
                    new TableCell({
                        children: [new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [new TextRun({ text: lValue, size: 24 })],
                            spacing: { before: 0, after: 0 }
                        })],
                        verticalAlign: VerticalAlign.CENTER,
                        margins: cellMargins,
                        width: { size: 567, type: WidthType.DXA }
                    }),
                    new TableCell({
                        children: [new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [new TextRun({ text: tValue, size: 24 })],
                            spacing: { before: 0, after: 0 }
                        })],
                        verticalAlign: VerticalAlign.CENTER,
                        margins: cellMargins,
                        width: { size: 567, type: WidthType.DXA }
                    }),
                    new TableCell({
                        children: [new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [new TextRun({ text: pValue, size: 24 })],
                            spacing: { before: 0, after: 0 }
                        })],
                        verticalAlign: VerticalAlign.CENTER,
                        margins: cellMargins,
                        width: { size: 567, type: WidthType.DXA }
                    }),
                    new TableCell({
                        children: [new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [new TextRun({ text: cValue, size: 24 })],
                            spacing: { before: 0, after: 0 }
                        })],
                        verticalAlign: VerticalAlign.CENTER,
                        margins: cellMargins,
                        width: { size: 567, type: WidthType.DXA }
                    })
                ]
            }),
            // Row 3: Branches full-width row
            new TableRow({
                children: [
                    new TableCell({
                        children: [new Paragraph({
                            alignment: AlignmentType.LEFT,
                            children: [
                                new TextRun({ text: "Branches: ", bold: true, size: 24 }),
                                new TextRun({ text: branches, size: 24 })
                            ],
                            spacing: { before: 0, after: 0 }
                        })],
                        columnSpan: 7,
                        verticalAlign: VerticalAlign.CENTER,
                        margins: cellMargins,
                        width: { size: 10204, type: WidthType.DXA }
                    })
                ]
            })
        ]
    });

    docChildren.push(basicInfoTable);

    // Spacer helper to separate tables cleanly without merging
    function addTableSpacer() {
        docChildren.push(new Paragraph({
            spacing: { before: 120, after: 120 },
            children: []
        }));
    }

    // 2. Objectives Table (Total width 18cm = 10204 dxa)
    const objectives = getListValues("objectivesContainer");
    if (objectives.length > 0) {
        addTableSpacer();
        
        const objectiveRows = [
            new TableRow({
                children: [
                    new TableCell({
                        children: [new Paragraph({
                            children: [new TextRun({ text: "Objectives:", bold: true, size: 24 })],
                            alignment: AlignmentType.LEFT,
                            spacing: { before: 60, after: 60 }
                        })],
                        margins: cellMargins,
                        width: { size: 10204, type: WidthType.DXA }
                    })
                ]
            })
        ];
        
        objectives.forEach(obj => {
            objectiveRows.push(new TableRow({
                children: [
                    new TableCell({
                        children: [new Paragraph({
                            children: [new TextRun({ text: `●  ${obj}`, size: 24 })],
                            alignment: AlignmentType.LEFT,
                            spacing: { before: 60, after: 60 }
                        })],
                        margins: cellMargins,
                        width: { size: 10204, type: WidthType.DXA }
                    })
                ]
            }));
        });

        docChildren.push(new Table({
            width: { size: 10204, type: WidthType.DXA },
            borders: tableBorders,
            rows: objectiveRows
        }));
    }

    // 3. Theory Syllabus Units Table (Total width 18cm = 10204 dxa)
    // Column 1: UNIT-I -> 3.0cm(1701 dxa), Column 2: Title -> 13.5cm(7653 dxa), Column 3: Hours -> 1.5cm(850 dxa)
    if (courseType === "Theory" || courseType === "Lab Oriented Theory") {
        addTableSpacer();

        const unitTableRows = [];
        for (let i = 1; i <= 5; i++) {
            const unitTitle = document.getElementById(`unit${i}Title`).value.trim();
            const unitHours = document.getElementById(`unit${i}Hours`).value;
            const unitSyllabus = document.getElementById(`unit${i}Syllabus`).value.trim();

            const roman = getRomanNumeral(i);
            
            // Unit header row
            unitTableRows.push(new TableRow({
                children: [
                    new TableCell({
                        children: [new Paragraph({
                            children: [new TextRun({ text: `UNIT-${roman}`, bold: true, size: 24 })],
                            alignment: AlignmentType.LEFT,
                            spacing: { before: 0, after: 0 }
                        })],
                        verticalAlign: VerticalAlign.CENTER,
                        margins: cellMargins,
                        width: { size: 1304, type: WidthType.DXA }
                    }),
                    new TableCell({
                        children: [new Paragraph({
                            alignment: AlignmentType.LEFT,
                            children: [new TextRun({ text: unitTitle.toUpperCase(), bold: true, size: 24 })],
                            spacing: { before: 0, after: 0 }
                        })],
                        verticalAlign: VerticalAlign.CENTER,
                        margins: cellMargins,
                        width: { size: 8050, type: WidthType.DXA }
                    }),
                    new TableCell({
                        children: [new Paragraph({
                            children: [new TextRun({ text: unitHours, bold: true, size: 24 })],
                            alignment: AlignmentType.RIGHT,
                            spacing: { before: 0, after: 0 }
                        })],
                        verticalAlign: VerticalAlign.CENTER,
                        margins: cellMargins,
                        width: { size: 850, type: WidthType.DXA }
                    })
                ]
            }));

            // Unit description syllabus content row (justified)
            const syllabusParagraphs = [];
            const lines = unitSyllabus.split("\n");
            lines.forEach(line => {
                if (line.trim()) {
                    syllabusParagraphs.push(new Paragraph({
                        children: [new TextRun({ text: line.trim(), size: 24 })],
                        alignment: AlignmentType.JUSTIFIED,
                        spacing: { before: 0, after: 0 }
                    }));
                }
            });

            unitTableRows.push(new TableRow({
                children: [
                    new TableCell({
                        children: syllabusParagraphs,
                        columnSpan: 3,
                        margins: cellMargins,
                        width: { size: 10204, type: WidthType.DXA }
                    })
                ]
            }));
        }

        // Total hours row
        unitTableRows.push(new TableRow({
            children: [
                new TableCell({
                    children: [new Paragraph({
                        children: [
                            new TextRun({ text: "Total Contact Hours: ", bold: true, size: 24 }),
                            new TextRun({ text: totalHoursVal.textContent, size: 24 })
                        ],
                        alignment: AlignmentType.LEFT,
                        spacing: { before: 0, after: 0 }
                    })],
                    columnSpan: 3,
                    margins: cellMargins,
                    width: { size: 10204, type: WidthType.DXA }
                })
            ]
        }));

        docChildren.push(new Table({
            width: { size: 10204, type: WidthType.DXA },
            borders: tableBorders,
            rows: unitTableRows
        }));
    }

    // 4. List of Experiments Table (Total width 18cm = 10204 dxa)
    // No=1.0cm(567 dxa), Description=17.0cm(9637 dxa)
    if (courseType === "Lab" || courseType === "Lab Oriented Theory") {
        const experiments = getListValues("experimentsContainer");
        if (experiments.length > 0) {
            addTableSpacer();

            const experimentRows = [
                new TableRow({
                    children: [
                        new TableCell({
                            children: [new Paragraph({
                                children: [new TextRun({ text: "LIST OF EXPERIMENTS", bold: true, size: 24 })],
                                alignment: AlignmentType.LEFT,
                                spacing: { before: 60, after: 60 }
                            })],
                            columnSpan: 2,
                            margins: cellMargins,
                            width: { size: 10204, type: WidthType.DXA }
                        })
                    ]
                })
            ];

            experiments.forEach((exp, idx) => {
                experimentRows.push(new TableRow({
                    children: [
                        new TableCell({
                            children: [new Paragraph({
                                children: [new TextRun({ text: (idx + 1).toString(), bold: true, size: 24 })],
                                alignment: AlignmentType.CENTER,
                                spacing: { before: 60, after: 60 }
                            })],
                            verticalAlign: VerticalAlign.CENTER,
                            margins: cellMargins,
                            width: { size: 567, type: WidthType.DXA }
                        }),
                        new TableCell({
                            children: [new Paragraph({
                                children: [new TextRun({ text: exp, size: 24 })],
                                alignment: AlignmentType.LEFT,
                                spacing: { before: 60, after: 60 }
                            })],
                            verticalAlign: VerticalAlign.CENTER,
                            margins: cellMargins,
                            width: { size: 9637, type: WidthType.DXA }
                        })
                    ]
                }));
            });

            docChildren.push(new Table({
                width: { size: 10204, type: WidthType.DXA },
                borders: tableBorders,
                rows: experimentRows
            }));
        }
    }

    // 5. Course Outcomes Table (Total width 18cm = 10204 dxa)
    const outcomes = getListValues("outcomesContainer");
    if (outcomes.length > 0) {
        addTableSpacer();

        const outcomeRows = [
            new TableRow({
                children: [
                    new TableCell({
                        children: [new Paragraph({
                            children: [new TextRun({ text: "Course Outcomes:", bold: true, size: 24 })],
                            alignment: AlignmentType.LEFT,
                            spacing: { before: 60, after: 60 }
                        })],
                        margins: cellMargins,
                        width: { size: 10204, type: WidthType.DXA }
                    })
                ]
            }),
            new TableRow({
                children: [
                    new TableCell({
                        children: [new Paragraph({
                            children: [new TextRun({ text: "On completion of the course, students will be able to", size: 24 })],
                            alignment: AlignmentType.LEFT,
                            spacing: { before: 60, after: 60 }
                        })],
                        margins: cellMargins,
                        width: { size: 10204, type: WidthType.DXA }
                    })
                ]
            })
        ];

        outcomes.forEach(out => {
            outcomeRows.push(new TableRow({
                children: [
                    new TableCell({
                        children: [new Paragraph({
                            children: [new TextRun({ text: `●  ${out}`, size: 24 })],
                            alignment: AlignmentType.LEFT,
                            spacing: { before: 60, after: 60 }
                        })],
                        margins: cellMargins,
                        width: { size: 10204, type: WidthType.DXA }
                    })
                ]
            }));
        });

        docChildren.push(new Table({
            width: { size: 10204, type: WidthType.DXA },
            borders: tableBorders,
            rows: outcomeRows
        }));
    }

    // 6. Suggested Evaluations & Activities Table (Total width 18cm = 10204 dxa)
    const evaluations = getListValues("evaluationsContainer");
    const activities = getListValues("activitiesContainer");
    if (evaluations.length > 0 || activities.length > 0) {
        addTableSpacer();

        const sugTableRows = [];
        if (evaluations.length > 0) {
            sugTableRows.push(new TableRow({
                children: [
                    new TableCell({
                        children: [new Paragraph({
                            children: [new TextRun({ text: "SUGGESTED EVALUATION METHODS", bold: true, size: 24 })],
                            alignment: AlignmentType.LEFT,
                            spacing: { before: 60, after: 60 }
                        })],
                        margins: cellMargins,
                        width: { size: 10204, type: WidthType.DXA }
                    })
                ]
            }));
            evaluations.forEach(ev => {
                sugTableRows.push(new TableRow({
                    children: [
                        new TableCell({
                            children: [new Paragraph({
                                children: [new TextRun({ text: `•  ${ev}`, size: 24 })],
                                alignment: AlignmentType.LEFT,
                                spacing: { before: 60, after: 60 }
                            })],
                            margins: cellMargins,
                            width: { size: 10204, type: WidthType.DXA }
                        })
                    ]
                }));
            });
        }

        if (activities.length > 0) {
            sugTableRows.push(new TableRow({
                children: [
                    new TableCell({
                        children: [new Paragraph({
                            children: [new TextRun({ text: "SUGGESTED ACTIVITIES", bold: true, size: 24 })],
                            alignment: AlignmentType.LEFT,
                            spacing: { before: 60, after: 60 }
                        })],
                        margins: cellMargins,
                        width: { size: 10204, type: WidthType.DXA }
                    })
                ]
            }));
            activities.forEach(act => {
                sugTableRows.push(new TableRow({
                    children: [
                        new TableCell({
                            children: [new Paragraph({
                                children: [new TextRun({ text: `•  ${act}`, size: 24 })],
                                alignment: AlignmentType.LEFT,
                                spacing: { before: 60, after: 60 }
                            })],
                            margins: cellMargins,
                            width: { size: 10204, type: WidthType.DXA }
                        })
                    ]
                }));
            });
        }

        docChildren.push(new Table({
            width: { size: 10204, type: WidthType.DXA },
            borders: tableBorders,
            rows: sugTableRows
        }));
    }

    // 7. Text Books & Reference Books Table (Total width 18cm = 10204 dxa)
    // No=1.0cm(567 dxa), Book=17.0cm(9637 dxa)
    const textbooks = getListValues("textbooksContainer");
    const references = getListValues("referencesContainer");
    if (textbooks.length > 0 || references.length > 0) {
        addTableSpacer();

        const bookTableRows = [];
        if (textbooks.length > 0) {
            bookTableRows.push(new TableRow({
                children: [
                    new TableCell({
                        children: [new Paragraph({
                            children: [new TextRun({ text: "Text Books:", bold: true, size: 24 })],
                            alignment: AlignmentType.LEFT,
                            spacing: { before: 60, after: 60 }
                        })],
                        columnSpan: 2,
                        margins: cellMargins,
                        width: { size: 10204, type: WidthType.DXA }
                    })
                ]
            }));
            textbooks.forEach((tb, idx) => {
                bookTableRows.push(new TableRow({
                    children: [
                        new TableCell({
                            children: [new Paragraph({
                                children: [new TextRun({ text: (idx + 1).toString(), bold: true, size: 24 })],
                                alignment: AlignmentType.CENTER,
                                spacing: { before: 60, after: 60 }
                            })],
                            verticalAlign: VerticalAlign.CENTER,
                            margins: cellMargins,
                            width: { size: 567, type: WidthType.DXA }
                        }),
                        new TableCell({
                            children: [new Paragraph({
                                children: [new TextRun({ text: tb, size: 24 })],
                                alignment: AlignmentType.LEFT,
                                spacing: { before: 60, after: 60 }
                            })],
                            verticalAlign: VerticalAlign.CENTER,
                            margins: cellMargins,
                            width: { size: 9637, type: WidthType.DXA }
                        })
                    ]
                }));
            });
        }

        if (references.length > 0) {
            bookTableRows.push(new TableRow({
                children: [
                    new TableCell({
                        children: [new Paragraph({
                            children: [new TextRun({ text: "Reference Books(s) / Web links:", bold: true, size: 24 })],
                            alignment: AlignmentType.LEFT,
                            spacing: { before: 60, after: 60 }
                        })],
                        columnSpan: 2,
                        margins: cellMargins,
                        width: { size: 10204, type: WidthType.DXA }
                    })
                ]
            }));
            references.forEach((ref, idx) => {
                bookTableRows.push(new TableRow({
                    children: [
                        new TableCell({
                            children: [new Paragraph({
                                children: [new TextRun({ text: (idx + 1).toString(), bold: true, size: 24 })],
                                alignment: AlignmentType.CENTER,
                                spacing: { before: 60, after: 60 }
                            })],
                            verticalAlign: VerticalAlign.CENTER,
                            margins: cellMargins,
                            width: { size: 567, type: WidthType.DXA }
                        }),
                        new TableCell({
                            children: [new Paragraph({
                                children: [new TextRun({ text: ref, size: 24 })],
                                alignment: AlignmentType.LEFT,
                                spacing: { before: 60, after: 60 }
                            })],
                            verticalAlign: VerticalAlign.CENTER,
                            margins: cellMargins,
                            width: { size: 9637, type: WidthType.DXA }
                        })
                    ]
                }));
            });
        }

        docChildren.push(new Table({
            width: { size: 10204, type: WidthType.DXA },
            borders: tableBorders,
            rows: bookTableRows
        }));
    }

    // Assemble the document
    const doc = new Document({
        documentDefaults: {
            run: {
                font: "Times New Roman",
                size: 24 // 12pt
            },
            paragraph: {
                alignment: AlignmentType.JUSTIFIED,
                spacing: {
                    before: 0,
                    after: 120 // 6pt after
                }
            }
        },
        sections: [
            {
                properties: {
                    page: {
                        size: {
                            width: 11906,
                            height: 16838,
                            orientation: PageOrientation ? PageOrientation.PORTRAIT : "portrait"
                        },
                        margin: {
                            top: 1440,
                            bottom: 1440,
                            left: 850, // 1.5cm left margin
                            right: 850 // 1.5cm right margin
                        }
                    }
                },
                children: docChildren
            }
        ]
    });

    // Generate blob and download
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
// EXCEL EXPORT & IMPORT UTILITIES
// ==========================================================================

// Helper to set list values programmatically using existing row builders
function setDynamicListValues(containerId, addBtnId, values) {
    const container = document.getElementById(containerId);
    
    // Clear all but first row
    while (container.children.length > 1) {
        container.lastElementChild.remove();
    }
    const firstInput = container.querySelector(".row-input");
    if (firstInput) {
        firstInput.value = "";
    }
    
    if (!values || values.length === 0) {
        return;
    }
    
    const addBtn = document.getElementById(addBtnId);
    values.forEach((val, index) => {
        if (index === 0) {
            if (firstInput) {
                firstInput.value = val;
                firstInput.dispatchEvent(new Event("input"));
            }
        } else {
            addBtn.click();
            const inputs = container.querySelectorAll(".row-input");
            const lastInput = inputs[inputs.length - 1];
            if (lastInput) {
                lastInput.value = val;
                lastInput.dispatchEvent(new Event("input"));
            }
        }
    });
}

function downloadExcelTemplate() {
    if (!window.XLSX) {
        showToast("Excel generator library is not loaded. Check internet connection.", "error");
        return;
    }

    const courseType = courseTypeSelect.value;
    const data = [
        ["Field Name", "Value (Replace the examples below with your own details)"],
        ["Course Type", courseType],
        ["Subject Code", "CS302"],
        ["Subject Name", "Data Structures & Algorithms"],
        ["Category", "PC"],
        ["L", "3"],
        ["T", "0"],
        ["P", "2"],
        ["C", "4"],
        ["Branch(es)", "Computer Science and Engineering"],
        ["Course Objectives", "Understand the memory representation of data structures.\nImplement stacks and queues.\nEvaluate recursive algorithms."]
    ];

    if (courseType === "Theory" || courseType === "Lab Oriented Theory") {
        for (let i = 1; i <= 5; i++) {
            const roman = getRomanNumeral(i);
            data.push([`Unit ${roman} Title`, `UNIT ${roman} TITLE HERE`]);
            data.push([`Unit ${roman} Contact Hours`, "9"]);
            data.push([`Unit ${roman} Syllabus`, "Topic 1 syllabus content. Topic 2 syllabus content. Topic 3 syllabus content."]);
        }
    }

    if (courseType === "Lab" || courseType === "Lab Oriented Theory") {
        data.push(["List of Experiments", "Stack operations using array.\nQueue operations using array.\nSingly linked list insertion and deletion.\nInfix to postfix conversion."]);
    }

    data.push(["Course Outcomes", "Implement basic dynamic list operations.\nApply stacks and queues to solve parsing tasks.\nAnalyze search trees."]);
    data.push(["Suggested Evaluation Methods", "Mid-term code design assessments.\nWeekly laboratory review marks."]);
    data.push(["Suggested Activities", "Peer code reviews.\nGroup algorithm whiteboarding."]);
    data.push(["Text Books", "Mark Allen Weiss, 'Data Structures and Algorithm Analysis in C++', Pearson."]);
    data.push(["Reference Books / Web links", "GeeksforGeeks Portal, https://www.geeksforgeeks.org/data-structures/."]);

    const ws = XLSX.utils.aoa_to_sheet(data);
    ws["!cols"] = [
        { wch: 30 },
        { wch: 80 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Syllabus Details");
    
    const formattedType = courseType.replace(/\s+/g, "_");
    XLSX.writeFile(wb, `${formattedType}_Syllabus_Template.xlsx`);
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
                throw new Error("No worksheets found in this Excel file.");
            }
            
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
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

            // Auto-detect and switch Course Classification
            if (fieldMap["coursetype"]) {
                const type = fieldMap["coursetype"];
                if (["Theory", "Lab", "Lab Oriented Theory"].includes(type)) {
                    courseTypeSelect.value = type;
                    handleCourseTypeChange();
                }
            }

            // Map standard text fields
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

            // Map Syllabus Units (1 to 5)
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

            // Map dynamic list fields
            const listMappings = [
                {
                    keys: ["courseobjectives", "objectives"],
                    containerId: "objectivesContainer",
                    addBtnId: "addObjectiveBtn"
                },
                {
                    keys: ["listofexperiments", "experiments", "experimentslist"],
                    containerId: "experimentsContainer",
                    addBtnId: "addExperimentBtn"
                },
                {
                    keys: ["courseoutcomes", "outcomes"],
                    containerId: "outcomesContainer",
                    addBtnId: "addOutcomeBtn"
                },
                {
                    keys: ["suggestedevaluationmethods", "evaluations", "evaluationmethods"],
                    containerId: "evaluationsContainer",
                    addBtnId: "addEvaluationBtn"
                },
                {
                    keys: ["suggestedactivities", "activities"],
                    containerId: "activitiesContainer",
                    addBtnId: "addActivityBtn"
                },
                {
                    keys: ["textbooks", "textbook", "textbookslist"],
                    containerId: "textbooksContainer",
                    addBtnId: "addTextbookBtn"
                },
                {
                    keys: ["referencebooksweblinks", "referencebooks", "references", "weblinks"],
                    containerId: "referencesContainer",
                    addBtnId: "addReferenceBtn"
                }
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
                    const lines = listData.split(/\r?\n/)
                        .map(line => line.trim().replace(/^(\d+[\.\)\s\t]+|●|•|-|\*)\s*/, "").trim())
                        .filter(line => line.length > 0);
                    setDynamicListValues(mapping.containerId, mapping.addBtnId, lines);
                }
            });

            // Update contact hours sum
            calculateTotalHours();
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

// Automatically detect and parse an entire pasted syllabus block
function parseFullSyllabusText() {
    try {
        const text = document.getElementById("quickPasteArea").value.trim();
        if (!text) {
            showToast("Please paste some syllabus text first.", "error");
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

            const lowerLine = line.toLowerCase();

            // Section transitions
            if (lowerLine.startsWith("objectives:") || lowerLine.startsWith("course objectives:")) {
                currentSection = "objectives";
                continue;
            }

            const unitMatch = line.match(/^\s*UNIT\s*[\-–—]?\s*(I|II|III|IV|V|1|2|3|4|5)\b/i);
            if (unitMatch) {
                const roman = unitMatch[1].toUpperCase();
                let unitNum = 1;
                if (roman === "I" || roman === "1") unitNum = 1;
                else if (roman === "II" || roman === "2") unitNum = 2;
                else if (roman === "III" || roman === "3") unitNum = 3;
                else if (roman === "IV" || roman === "4") unitNum = 4;
                else if (roman === "V" || roman === "5") unitNum = 5;
                
                currentSection = `unit${unitNum}`;

                const parts = line.split(/\t+/).map(p => p.trim()).filter(Boolean);
                if (parts.length >= 3) {
                    units[unitNum - 1].title = parts[1];
                    units[unitNum - 1].hours = parts[2];
                } else {
                    const spaceParts = line.replace(/^\s*UNIT\s*[\-–—]?\s*(I|II|III|IV|V|1|2|3|4|5)/i, "").trim().split(/\s{2,}/);
                    if (spaceParts.length >= 2) {
                        units[unitNum - 1].title = spaceParts[0].trim();
                        units[unitNum - 1].hours = spaceParts[1].trim();
                    } else {
                        const remaining = line.replace(/^\s*UNIT\s*[\-–—]?\s*(I|II|III|IV|V|1|2|3|4|5)/i, "").trim();
                        const hourMatch = remaining.match(/(\d+)$/);
                        if (hourMatch) {
                            units[unitNum - 1].hours = hourMatch[1];
                            units[unitNum - 1].title = remaining.replace(/(\d+)$/, "").trim();
                        } else {
                            units[unitNum - 1].title = remaining;
                        }
                    }
                }
                continue;
            }

            if (lowerLine.startsWith("list of experiments") || lowerLine.startsWith("experiments:") || lowerLine.startsWith("experiments list:")) {
                currentSection = "experiments";
                continue;
            }

            if (lowerLine.startsWith("course outcomes:") || lowerLine.startsWith("outcomes:")) {
                currentSection = "outcomes";
                continue;
            }

            if (lowerLine.startsWith("suggested evaluation methods") || lowerLine.startsWith("evaluation methods:")) {
                currentSection = "evaluations";
                continue;
            }

            if (lowerLine.startsWith("suggested activities") || lowerLine.startsWith("activities:")) {
                currentSection = "activities";
                continue;
            }

            if (lowerLine.startsWith("text book(s)") || lowerLine.startsWith("textbook(s)") || lowerLine.startsWith("text books") || lowerLine.startsWith("textbooks") || lowerLine.startsWith("text book")) {
                currentSection = "textbooks";
                continue;
            }

            if (lowerLine.startsWith("reference book(s)") || lowerLine.startsWith("referencebook(s)") || lowerLine.startsWith("reference books") || lowerLine.startsWith("references") || lowerLine.startsWith("reference book") || lowerLine.startsWith("web links")) {
                currentSection = "references";
                continue;
            }

            if (lowerLine.startsWith("total contact hours:")) {
                currentSection = "";
                continue;
            }

            // Basic Info Match (Subject Code, Name, Category, L, T, P, C)
            const basicMatch = line.match(/^([A-Za-z0-9\-]+)(?:\t+|\s{2,})([A-Za-z0-9\s&,\(\)\-\/:\.\+]+)(?:\t+|\s{2,})([A-Za-z0-9]{1,5})(?:\t+|\s{2,})(\d+)(?:\t+|\s{2,}|\s+)(\d+)(?:\t+|\s{2,}|\s+)(\d+)(?:\t+|\s{2,}|\s+)(\d+)/);
            if (basicMatch && !subjectCode) {
                subjectCode = basicMatch[1].trim();
                subjectName = basicMatch[2].trim();
                category = basicMatch[3].trim();
                l = basicMatch[4].trim();
                t = basicMatch[5].trim();
                p = basicMatch[6].trim();
                c = basicMatch[7].trim();

                if (i + 1 < lines.length) {
                    const nextLine = lines[i + 1].trim();
                    const nextLineLower = nextLine.toLowerCase();
                    if (nextLine && 
                        !nextLineLower.startsWith("objectives") && 
                        !nextLineLower.startsWith("unit") && 
                        !nextLineLower.includes("course outcomes") &&
                        !nextLineLower.includes("suggested") &&
                        !nextLineLower.startsWith("text books") &&
                        !nextLineLower.startsWith("text book") &&
                        !nextLineLower.startsWith("reference")) {
                        branches = nextLine;
                        i++;
                    }
                }
                continue;
            }

            // Clean bullets and numbers
            const cleanLine = line.replace(/^(\d+[\.\)\s\t]+|●|•|-|\*)\s*/, "").trim();
            if (!cleanLine) continue;

            if (currentSection === "objectives") {
                objectives.push(cleanLine);
            } else if (currentSection === "experiments") {
                if (lowerLine.startsWith("design the given experiments") || lowerLine.includes("contact hours") || lowerLine.includes("total contact hours")) continue;
                experiments.push(cleanLine);
            } else if (currentSection.startsWith("unit")) {
                if (lowerLine.includes("contact hours")) continue;
                const unitIndex = parseInt(currentSection.replace("unit", "")) - 1;
                units[unitIndex].syllabus.push(line);
            } else if (currentSection === "outcomes") {
                if (lowerLine.includes("on completion of the course")) continue;
                outcomes.push(cleanLine);
            } else if (currentSection === "evaluations") {
                evaluations.push(cleanLine);
            } else if (currentSection === "activities") {
                activities.push(cleanLine);
            } else if (currentSection === "textbooks") {
                textbooks.push(cleanLine);
            } else if (currentSection === "references") {
                if (cleanLine.endsWith(":") || cleanLine.toLowerCase().includes("web links for")) continue;
                references.push(cleanLine);
            }
        }

        // Populate standard fields
        if (subjectCode) {
            document.getElementById("subjectCode").value = subjectCode;
            document.getElementById("subjectCode").dispatchEvent(new Event("input"));
        }
        if (subjectName) {
            document.getElementById("subjectName").value = subjectName;
            document.getElementById("subjectName").dispatchEvent(new Event("input"));
        }
        if (category) {
            document.getElementById("category").value = category;
            document.getElementById("category").dispatchEvent(new Event("input"));
        }
        
        document.getElementById("lValue").value = l;
        document.getElementById("lValue").dispatchEvent(new Event("input"));
        document.getElementById("tValue").value = t;
        document.getElementById("tValue").dispatchEvent(new Event("input"));
        document.getElementById("pValue").value = p;
        document.getElementById("pValue").dispatchEvent(new Event("input"));
        document.getElementById("cValue").value = c;
        document.getElementById("cValue").dispatchEvent(new Event("input"));
        
        if (branches) {
            document.getElementById("branches").value = branches.replace(/^Common to\s+/i, "");
            document.getElementById("branches").dispatchEvent(new Event("input"));
        }

        // Auto-detect course type
        let detectedType = "Theory";
        if (parseInt(l) > 0 && parseInt(p) > 0) {
            detectedType = "Lab Oriented Theory";
        } else if (parseInt(l) === 0 && parseInt(p) > 0) {
            detectedType = "Lab";
        }
        
        courseTypeSelect.value = detectedType;
        handleCourseTypeChange();

        // Populate units
        for (let i = 1; i <= 5; i++) {
            const u = units[i - 1];
            const titleInput = document.getElementById(`unit${i}Title`);
            const hoursInput = document.getElementById(`unit${i}Hours`);
            const syllabusTextarea = document.getElementById(`unit${i}Syllabus`);
            
            if (titleInput) {
                titleInput.value = u.title;
                titleInput.dispatchEvent(new Event("input"));
            }
            if (hoursInput) {
                hoursInput.value = u.hours;
                hoursInput.dispatchEvent(new Event("input"));
            }
            if (syllabusTextarea) {
                syllabusTextarea.value = u.syllabus.join("\n");
                syllabusTextarea.dispatchEvent(new Event("input"));
            }
        }

        // Populate dynamic lists
        if (objectives.length > 0) {
            setDynamicListValues("objectivesContainer", "addObjectiveBtn", objectives);
        }
        if (experiments.length > 0) {
            setDynamicListValues("experimentsContainer", "addExperimentBtn", experiments);
        }
        if (outcomes.length > 0) {
            setDynamicListValues("outcomesContainer", "addOutcomeBtn", outcomes);
        }
        if (evaluations.length > 0) {
            setDynamicListValues("evaluationsContainer", "addEvaluationBtn", evaluations);
        }
        if (activities.length > 0) {
            setDynamicListValues("activitiesContainer", "addActivityBtn", activities);
        }
        if (textbooks.length > 0) {
            setDynamicListValues("textbooksContainer", "addTextbookBtn", textbooks);
        }
        if (references.length > 0) {
            setDynamicListValues("referencesContainer", "addReferenceBtn", references);
        }

        calculateTotalHours();
        showToast("Entire syllabus successfully auto-detected and populated!", "success");
    } catch (err) {
        console.error("Syllabus parser error:", err);
        showToast(`Failed to parse syllabus: ${err.message}`, "error");
    }
}

// ==========================================================================
// INITIALIZATION
// ==========================================================================
document.addEventListener("DOMContentLoaded", () => {
    // 3. Objectives
    initDynamicList("objectivesContainer", "addObjectiveBtn", "removeObjectiveBtn", "e.g. Understand the memory representation of linear data structures.", true);

    // 5. Experiments
    initDynamicList("experimentsContainer", "addExperimentBtn", "removeExperimentBtn", "e.g. Implement Stack operations using an array.", true);

    // 7. Course Outcomes
    initDynamicList("outcomesContainer", "addOutcomeBtn", "removeOutcomeBtn", "e.g. Design and evaluate recursive algorithms for tree traversal.", true);

    // 8. Text Books
    initDynamicList("textbooksContainer", "addTextbookBtn", "removeTextbookBtn", "e.g. Mark Allen Weiss, 'Data Structures and Algorithm Analysis in C++', Pearson.", true);

    // 9. Reference Books
    initDynamicList("referencesContainer", "addReferenceBtn", "removeReferenceBtn", "e.g. GeeksforGeeks Portal, https://www.geeksforgeeks.org/data-structures/.", true);

    // 10. Suggested Activities (Optional)
    initDynamicList("activitiesContainer", "addActivityBtn", "removeActivityBtn", "e.g. Peer review of flowchart representations.", false);

    // 11. Suggested Evaluation Methods (Optional)
    initDynamicList("evaluationsContainer", "addEvaluationBtn", "removeEvaluationBtn", "e.g. Bi-weekly MCQ quizzes on theoretical bounds.", false);

    // Initialize course type views
    handleCourseTypeChange();

    // Excel Transfer bindings
    const downloadTemplateBtn = document.getElementById("downloadTemplateBtn");
    const excelUpload = document.getElementById("excelUpload");
    if (downloadTemplateBtn) {
        downloadTemplateBtn.addEventListener("click", downloadExcelTemplate);
    }
    if (excelUpload) {
        excelUpload.addEventListener("change", handleExcelUpload);
    }

    // Text Parser binding
    const btnQuickParse = document.getElementById("btnQuickParse");
    if (btnQuickParse) {
        btnQuickParse.addEventListener("click", parseFullSyllabusText);
    }
});
