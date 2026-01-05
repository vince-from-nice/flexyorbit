export function addSlider(container, labelText, min, max, initial, onChange, step = 1, options = {}) {
    const wrapper = document.createElement('div');
    wrapper.classList.add('slider-wrapper');

    const topRow = document.createElement('div');
    topRow.classList.add('slider-top-row');

    const label = document.createElement('label');
    label.textContent = labelText;
    topRow.appendChild(label);

    const numberInput = document.createElement('input');
    numberInput.type = 'number';
    numberInput.min = min;
    numberInput.max = max;
    numberInput.step = step;
    numberInput.value = initial;  // garde la précision initiale
    numberInput.classList.add('number-input');
    topRow.appendChild(numberInput);

    const logarithmic = options.logarithmic || false;

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.classList.add('custom-slider');

    if (logarithmic) {
        slider.min = 0;
        slider.max = 1;
        slider.step = 0.0001;
        // Protection contre log(0) ou valeurs invalides
        const norm = (initial > min && min > 0)
            ? Math.log(initial / min) / Math.log(max / min)
            : 0;
        slider.value = Math.max(0, Math.min(1, norm));
    } else {
        slider.min = min;
        slider.max = max;
        slider.step = step;
        slider.value = initial;  // ← position exacte dès le départ
    }

    // Dynamic gradient
    function updateGradient() {
        const norm = (slider.value - slider.min) / (slider.max - slider.min);
        const percent = norm * 100;
        slider.style.background = `linear-gradient(to right, #00aaff ${percent}%, #444 ${percent}%)`;
    }
    slider.addEventListener('input', updateGradient);
    updateGradient();

    const snapToStep = (val) => Math.round(val / step) * step;

    const updateFromSlider = () => {
        const norm = (slider.value - slider.min) / (slider.max - slider.min);
        let val;
        if (logarithmic) {
            val = min * Math.pow(max / min, norm);
        } else {
            val = min + norm * (max - min);
        }

        // Remplacer Math.round(val) par :
        val = Math.round(val / step) * step;   // ← snap au pas réel (0.1, 0.01, 1...)

        val = Math.max(min, Math.min(max, val));

        numberInput.value = val;
        onChange(val);
        updateGradient();
    };

    const updateFromNumber = () => {
        let val = parseFloat(numberInput.value);
        if (isNaN(val)) return;

        // Remplacer Math.round(val) par :
        val = Math.round(val / step) * step;   // ← même chose ici

        val = Math.max(min, Math.min(max, val));
        numberInput.value = val;

        let norm;
        if (logarithmic) {
            norm = Math.log(val / min) / Math.log(max / min);
        } else {
            norm = (val - min) / (max - min);
        }
        slider.value = slider.min + norm * (slider.max - slider.min);
        onChange(val);
        updateGradient();
    };

    slider.addEventListener('input', updateFromSlider);
    numberInput.addEventListener('change', updateFromNumber);
    // Optionnel : pour update live pendant la frappe
    // numberInput.addEventListener('input', updateFromNumber);

    wrapper.appendChild(topRow);
    wrapper.appendChild(slider);
    container.appendChild(wrapper);

    // Force une synchro initiale propre
    updateFromNumber();

    return [numberInput, slider];
}

export function addCheckbox(parentEl, labelBefore, labelAfter, initialValue, onChange) {
    const row = document.createElement("div");
    row.className = "checkbox-wrapper";

    if (labelBefore) {
        const lblB = document.createElement("label");
        lblB.textContent = labelBefore;
        //lblB.className = "ui-checkbox-label-before";
        row.appendChild(lblB);
    }

    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = Boolean(initialValue);

    cb.addEventListener("change", () => {
        onChange(cb.checked);
    });

    row.appendChild(cb);

    if (labelAfter) {
        const lblA = document.createElement("label");
        lblA.textContent = labelAfter;
        //lblA.className = "ui-checkbox-label-after";
        row.appendChild(lblA);
    }

    parentEl.appendChild(row);

    return cb;
}

export function addCustomSelect(parentEl, labelBefore, labelAfter, options, initialValue, onChange) {
    const wrapper = document.createElement("div");
    wrapper.className = "custom-select-wrapper";

    if (labelBefore) {
        const lblBefore = document.createElement("label");
        lblBefore.className = "custom-select-label-before";
        lblBefore.textContent = labelBefore;
        wrapper.appendChild(lblBefore);
    }

    const box = document.createElement("div");
    box.className = "custom-select-box";

    const selected = document.createElement("div");
    selected.className = "custom-select-selected";

    const selectedText = document.createElement("span");
    selectedText.className = "custom-select-selected-text";

    const arrow = document.createElement("span");
    arrow.classNameName = "custom-select-arrow";
    arrow.textContent = "▾";

    selected.appendChild(selectedText);
    selected.appendChild(arrow);
    box.appendChild(selected);

    const list = document.createElement("div");
    list.className = "custom-select-list";

    let currentValue = initialValue ?? options[0]?.value;

    function setValue(value, trigger = true) {
        const opt = options.find(o => o.value === value);
        if (!opt) return;
        currentValue = value;
        selectedText.textContent = opt.label;
        if (trigger) onChange(value);
    }

    options.forEach(opt => {
        const item = document.createElement("div");
        item.className = "custom-select-item";
        item.textContent = opt.label;
        item.addEventListener("click", () => {
            setValue(opt.value);
            list.classList.remove("open");
        });
        list.appendChild(item);
    });

    selected.addEventListener("click", e => {
        e.stopPropagation();
        list.classList.toggle("open");
    });

    document.addEventListener("click", () => {
        list.classList.remove("open");
    });

    box.appendChild(list);
    wrapper.appendChild(box);

    if (labelAfter) {
        const lblAfter = document.createElement("div");
        lblAfter.className = "custom-select-label-after";
        lblAfter.textContent = labelAfter;
        wrapper.appendChild(lblAfter);
    }

    parentEl.appendChild(wrapper);

    setValue(currentValue, false);

    return {
        get value() { return currentValue; },
        set value(v) { setValue(v); },
        // Allow an update of the option list
        updateOptions: function (newOptions) {
            options = newOptions;
            list.innerHTML = '';
            // Clear existing items
            newOptions.forEach(opt => {
                const item = document.createElement("div");
                item.className = "custom-select-item";
                item.textContent = opt.label;
                item.addEventListener("click", () => {
                    setValue(opt.value);
                    list.classList.remove("open");
                });
                list.appendChild(item);
            });
            // Set the current value if it still exists
            if (newOptions.some(o => o.value === currentValue)) {
                setValue(currentValue, false);
            } else if (newOptions.length > 0) {
                setValue(newOptions[0].value, true);
            }
        }
    };
}
