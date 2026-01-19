export function addSlider(container, labelText, min, max, initial, step, onChange, options = {}) {
    min = Number(min);
    max = Number(max);
    initial = Number(initial);
    step = Number(step) || 1;

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
    numberInput.value = initial;
    numberInput.classList.add('number-input');
    topRow.appendChild(numberInput);

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.classList.add('custom-slider');

    slider.setValue = function (value) {
        const numValue = parseFloat(value);
        if (isNaN(numValue)) return;

        if (this.dataset.realMin !== undefined) {
            const realMin = parseFloat(this.dataset.realMin);
            const realMax = parseFloat(this.dataset.realMax);

            let normalized = 0;
            if (numValue > realMin && realMin > 0) {
                normalized = Math.log(numValue / realMin) / Math.log(realMax / realMin);
            }
            this.value = Math.max(0, Math.min(1, normalized));
        } else {
            this.value = Math.max(parseFloat(this.min), Math.min(parseFloat(this.max), numValue));
        }

        //this.dispatchEvent(new Event('input'));
        //this.dispatchEvent(new Event('change'));
        //this.updateGradient();
    };

    const logarithmic = options.logarithmic || false;
    if (logarithmic) {
        slider.dataset.realMin = min;
        slider.dataset.realMax = max;
    }

    if (logarithmic) {
        slider.min = 0;
        slider.max = 1;
        slider.step = 0.0001;
        const norm = (initial > min && min > 0)
            ? Math.log(initial / min) / Math.log(max / min)
            : 0;
        slider.value = Math.max(0, Math.min(1, norm));
    } else {
        slider.min = min;
        slider.max = max;
        slider.step = step;
        slider.value = initial;
    }

    // function updateGradient() {
    //     const norm = (slider.value - slider.min) / (slider.max - slider.min);
    //     const percent = norm * 100;
    //     slider.style.background = `linear-gradient(to right, #00aaff ${percent}%, #444 ${percent}%)`;
    // }
    // slider.addEventListener('input', updateGradient);
    // updateGradient();

    const updateFromSlider = () => {
        const norm = (slider.value - slider.min) / (slider.max - slider.min);
        let val;
        if (logarithmic) {
            val = min * Math.pow(max / min, norm);
        } else {
            val = min + norm * (max - min);
        }
        val = Math.round(val / step) * step;
        val = Math.max(min, Math.min(max, val));
        numberInput.value = val;
        onChange(val);
        // updateGradient();
    };

    const updateFromNumber = () => {
        let val = parseFloat(numberInput.value);
        if (isNaN(val)) return;
        val = Math.round(val / step) * step;
        val = Math.max(min, Math.min(max, val));
        numberInput.value = val;
        let norm;
        if (logarithmic) {
            norm = Math.log(val / min) / Math.log(max / min);
        } else {
            norm = (val - min) / (max - min);
        }
        slider.value = Number(slider.min) + norm * (Number(slider.max) - Number(slider.min));
        onChange(val);
        // updateGradient();
    };

    slider.addEventListener('input', updateFromSlider);
    numberInput.addEventListener('change', updateFromNumber);

    wrapper.appendChild(topRow);
    wrapper.appendChild(slider);
    container.appendChild(wrapper);

    updateFromNumber();

    return [numberInput, slider];
}

export function addCheckbox(parentEl, labelBefore = '', labelAfter = '', initialValue = false, onChange, inline = false) {
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = Boolean(initialValue);

    checkbox.addEventListener("change", () => onChange(checkbox.checked));

    const elements = [];

    if (labelBefore) {
        const lbl = document.createElement("label");
        lbl.textContent = labelBefore;
        elements.push(lbl);
    }

    elements.push(checkbox);

    if (labelAfter) {
        const lbl = document.createElement("label");
        lbl.textContent = labelAfter;
        elements.push(lbl);
    }

    if (inline) {
        const fragment = document.createDocumentFragment();
        elements.forEach(el => fragment.appendChild(el));
        parentEl.appendChild(fragment);
    } else {
        const wrapper = document.createElement("div");
        wrapper.className = "checkbox-wrapper";
        elements.forEach(el => wrapper.appendChild(el));
        parentEl.appendChild(wrapper);
    }

    return checkbox;
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
        updateOptions: function (newOptions, preferredValue = null) {
            options = newOptions;
            list.innerHTML = '';
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
            let valueToSet = null;
            // 1. On privilégie la valeur explicitement demandée (si elle existe)
            if (preferredValue && newOptions.some(o => o.value === preferredValue)) {
                valueToSet = preferredValue;
            }
            // 2. Sinon on garde l'ancienne si toujours valide
            else if (currentValue && newOptions.some(o => o.value === currentValue)) {
                valueToSet = currentValue;
            }
            // 3. Sinon on prend la première (fallback)
            else if (newOptions.length > 0) {
                valueToSet = newOptions[0].value;
            }
            if (valueToSet !== null) {
                const shouldTriggerChange = (valueToSet !== currentValue);
                setValue(valueToSet, shouldTriggerChange);
            }
        }
    };
}

export function addPanel(parent, name) {
    const details = document.createElement('details');
    details.open = false;
    details.classList.add('control-group');

    const summary = document.createElement('summary');
    summary.textContent = name;
    details.appendChild(summary);

    const groupDiv = document.createElement('div');
    groupDiv.classList.add('group-content');
    details.appendChild(groupDiv);
    parent.appendChild(details);

    return groupDiv;
}

export function addSubPanel(parentContainer, title, openByDefault = false) {
    const details = document.createElement('details');
    details.open = openByDefault;
    details.classList.add('sub-control-group');

    const summary = document.createElement('summary');
    summary.textContent = title;
    details.appendChild(summary);

    const content = document.createElement('div');
    content.classList.add('sub-group-content');
    details.appendChild(content);

    parentContainer.appendChild(details);

    return content;
}

export function addReadOnly(container, labelText, initialValue, color = '#0f9') {
    const wrapper = document.createElement('div');
    wrapper.classList.add('read-only-field');

    const label = document.createElement('label');
    label.textContent = labelText;

    const valueSpan = document.createElement('span');
    valueSpan.classList.add('read-only-value');
    valueSpan.textContent = initialValue;
    valueSpan.style.color = color;

    wrapper.appendChild(label);
    wrapper.appendChild(valueSpan);
    container.appendChild(wrapper);

    return valueSpan;
}

export function addEditableText(container, labelText, initialValue, onChange) {
    const wrapper = document.createElement('div');
    wrapper.classList.add('text-field');

    const label = document.createElement('label');
    label.textContent = labelText;

    const input = document.createElement('input');
    input.type = 'text';
    input.value = initialValue;

    input.addEventListener('change', () => onChange?.(input.value));

    wrapper.appendChild(label);
    wrapper.appendChild(input);
    container.appendChild(wrapper);

    return input;
}