import world from '../world.js';
import { scaleToKm } from '../constants.js';
import { cartesianToPolar, polarToCartesian } from '../utils.js';
import { TRAIL_STYLES } from '../scene/trails.js';
import { addSlider, addCheckbox, addCustomSelect, addSubPanel, addReadOnly, addEditableText, addColorPicker } from './widgets.js';
import { selectCameraTarget } from './camera.js';
import { ENTITY_TYPES } from '../entity.js';

let currentEntityName = null;
let entityPanelContainer = null;
let entitySelectRef = null;
const entityWidgets = {};
const entitySelectOptions = [];

export function createEntityWidgets(entityPanel) {
    entitySelectRef = addCustomSelect(entityPanel, 'Select an object or press \'t\' to switch', null, [], null, name => {
        currentEntityName = name;
        selectCameraTarget(name);
        updateEntityWidgets();
    });

    window.addEventListener('keydown', e => {
        if (e.repeat || e.ctrlKey || e.altKey || e.metaKey) return;
        const currentIdx = entitySelectOptions.findIndex(opt => opt.value === currentEntityName);
        if (e.key === 't') {
            const nextIdx = (currentIdx + 1) % entitySelectOptions.length;
            entitySelectRef.value = entitySelectOptions[nextIdx].value;
        } else if (e.key === 'r') {
            const prevIdx = (currentIdx - 1 + entitySelectOptions.length) % entitySelectOptions.length;
            entitySelectRef.value = entitySelectOptions[prevIdx].value;
        } 
    });

    entityPanelContainer = document.createElement('div');
    entityPanel.appendChild(entityPanelContainer);

    buildStaticEntityPanel();
}

function buildStaticEntityPanel() {
    entityPanelContainer.innerHTML = '';

    // ── Infos ───────────────────────────────────────────────────────────────
    const infos = addSubPanel(entityPanelContainer, 'Infos', false);
    entityWidgets.type = addReadOnly(infos, 'Type', '');
    entityWidgets.status = addReadOnly(infos, 'Status', '', '#0f9');
    entityWidgets.description = addEditableText(infos, 'Description', '', ev => {
        const e = entityWidgets.current;
        if (e) e.description = ev.target.value;
    });
    entityWidgets.massPair = addSlider(infos, 'Mass (kg)', 1, 10000, 1, 1, v => {
        const e = entityWidgets.current;
        if (e) e.mass = v;
    }, { logarithmic: true });
    entityWidgets.dragPair = addSlider(infos, 'Drag coeff.', 0.0001, 0.01, 0.0001, 0.0001, v => {
        const e = entityWidgets.current;
        if (e) e.dragCoefficient = v;
    });

    // ── Scaling ─────────────────────────────────────────────────────────────
    const scaling = addSubPanel(entityPanelContainer, 'Scaling', false);
    entityWidgets.globalScalePair = addSlider(scaling, 'Global scale', 1, 100000, 1, 1, v => {
        const e = entityWidgets.current;
        if (!e) return;
        e.body.scale.set(v, v, v);
        entityWidgets.scaleXPair[1].setValue(v);
        entityWidgets.scaleYPairs[1].setValue(v);
        entityWidgets.scaleZPair[1].setValue(v);
    }, { logarithmic: true });
    entityWidgets.scaleXPair = addSlider(scaling, 'Scale X', 1, 100000, 1, 1, v => {
        const e = entityWidgets.current;
        if (e) e.body.scale.x = v;
    }, { logarithmic: true });
    entityWidgets.scaleYPairs = addSlider(scaling, 'Scale Y', 1, 100000, 1, 1, v => {
        const e = entityWidgets.current;
        if (e) e.body.scale.y = v;
    }, { logarithmic: true });
    entityWidgets.scaleZPair = addSlider(scaling, 'Scale Z', 1, 100000, 1, 1, v => {
        const e = entityWidgets.current;
        if (e) e.body.scale.z = v;
    }, { logarithmic: true });

    // ── Position ────────────────────────────────────────────────────────────
    const posPanel = addSubPanel(entityPanelContainer, 'Position', false);
    const worldGrp = addSubPanel(posPanel, 'World coords', false);
    entityWidgets.posX = addReadOnly(worldGrp, 'X (km)', '');
    entityWidgets.posY = addReadOnly(worldGrp, 'Y (km)', '');
    entityWidgets.posZ = addReadOnly(worldGrp, 'Z (km)', '');
    const polarGrp = addSubPanel(posPanel, 'Earth coords', true);
    entityWidgets.latPair = addSlider(polarGrp, 'Latitude (°)', -90, 90, 0, 0.1, v => updatePolarPosition('lat', v));
    entityWidgets.lonPair = addSlider(polarGrp, 'Longitude (°)', -180, 180, 0, 0.1, v => updatePolarPosition('lon', v));
    entityWidgets.altPair = addSlider(polarGrp, 'Altitude (km)', 1, 500000, 1, 1, v => updatePolarPosition('alt', v), { logarithmic: true });

    // ── Velocity ────────────────────────────────────────────────────────────
    const vel = addSubPanel(entityPanelContainer, 'Velocity', false);
    entityWidgets.vx = addReadOnly(vel, 'Vx (km/s)', '');
    entityWidgets.vy = addReadOnly(vel, 'Vy (km/s)', '');
    entityWidgets.vz = addReadOnly(vel, 'Vz (km/s)', '');
    entityWidgets.speed = addReadOnly(vel, 'Speed (km/s)', '');
    entityWidgets.showVel = addCheckbox(vel, 'Show velocity vector', null, false, v => {
        const e = entityWidgets.current;
        if (e) e.vectors.showVelocity = v;
    });

    // ── Acceleration ────────────────────────────────────────────────────────
    const acc = addSubPanel(entityPanelContainer, 'Acceleration', false);
    const accContainer = document.createElement('div');
    Object.assign(accContainer.style, { display: 'flex', flexDirection: 'column', gap: '2px', margin: '2px 0', width: '100%' });
    acc.appendChild(accContainer);
    entityWidgets.totalAcc = addReadOnly(accContainer, 'Total (km/s²)', '');
    const gRow = makeAccelerationRow(accContainer);
    entityWidgets.gravAcc = addReadOnly(gRow, '→ Gravity (km/s²)', '');
    entityWidgets.showGrav = addCheckbox(gRow, null, null, false, v => {
        const e = entityWidgets.current;
        if (e) e.vectors.showAccelerationForGravity = v;
    });
    const dRow = makeAccelerationRow(accContainer);
    entityWidgets.dragAcc = addReadOnly(dRow, '→ Drag (km/s²)', '');
    entityWidgets.showDrag = addCheckbox(dRow, null, null, false, v => {
        const e = entityWidgets.current;
        if (e) e.vectors.showAccelerationForDrag = v;
    });
    const eRow = makeAccelerationRow(accContainer);
    entityWidgets.engineAcc = addReadOnly(eRow, '→ Engine (km/s²)', '');
    entityWidgets.showEngine = addCheckbox(eRow, null, null, false, v => {
        const e = entityWidgets.current;
        if (e) e.vectors.showAccelerationForEngine = v;
    });
    const totalRow = makeAccelerationRow(accContainer);
    totalRow.style.marginTop = '10px';
    const spacer = document.createElement('div');
    spacer.style.width = '200px';
    spacer.style.visibility = 'hidden';
    totalRow.appendChild(spacer);
    entityWidgets.showTotalAcc = addCheckbox(totalRow, 'Show total acceleration vector', null, false, v => {
        const e = entityWidgets.current;
        if (e) e.vectors.showAcceleration = v;
    });

    // ── Trail ───────────────────────────────────────────────────────────────
    const trail = addSubPanel(entityPanelContainer, 'Trail display', false);
    entityWidgets.trailEnabled = addCheckbox(trail, 'Enabled', null, false, v => {
        const e = entityWidgets.current;
        if (e) e.trail.enabled = v;
    });
    entityWidgets.trailStyle = addCustomSelect(trail, 'Style', null, TRAIL_STYLES, TRAIL_STYLES[0].value, v => {
        const e = entityWidgets.current;
        if (e) e.trail.updateTrailStyle(v);
    });
    entityWidgets.trailColor = addColorPicker(trail, 'Color', '#ffffff', hex => {
        const e = entityWidgets.current;
        if (e) e.trail.updateTrailColor(hex);
    });
    entityWidgets.trailLifetimePair = addSlider(trail, 'Lifetime (s)', 1, 1000, 1, 1, v => {
        const e = entityWidgets.current;
        if (e) e.trail.lifetime = v;
    });
}

function makeAccelerationRow(container) {
    const row = document.createElement('div');
    Object.assign(row.style, { display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', minWidth: '100%', boxSizing: 'border-box' });
    container.appendChild(row);
    return row;
}

function updatePolarPosition(key, value) {
    const e = entityWidgets.current;
    if (!e) return;
    const p = cartesianToPolar(e.body.position);
    p[key] = parseFloat(value);
    e.body.position.copy(polarToCartesian(p.lat, p.lon, p.alt));
}

export function updateEntityWidgets() {
    const entity = world.getEntityByName(currentEntityName);
    if (!entity) return;

    entityWidgets.current = entity;

    // Infos
    entityWidgets.type.textContent = entity.type;
    entityWidgets.status.textContent = entity.isFreeFalling ? 'Flying' : 'Crashed';
    entityWidgets.status.style.color = entity.isFreeFalling ? 'rgba(37, 233, 40, 1)' : '#f44';
    entityWidgets.description.value = entity.description;
    entityWidgets.massPair[0].value = entity.mass;
    entityWidgets.massPair[1].setValue(entity.mass);
    entityWidgets.dragPair[0].value = entity.dragCoefficient;
    entityWidgets.dragPair[1].setValue(entity.dragCoefficient);

    // Scaling
    const s = entity.body.scale;
    const globalVal = (s.x + s.y + s.z) / 3;
    entityWidgets.globalScalePair[0].value = globalVal;
    entityWidgets.globalScalePair[1].setValue(globalVal);
    entityWidgets.scaleXPair[0].value = s.x;
    entityWidgets.scaleXPair[1].setValue(s.x);
    entityWidgets.scaleYPairs[0].value = s.y;
    entityWidgets.scaleYPairs[1].setValue(s.y);
    entityWidgets.scaleZPair[0].value = s.z;
    entityWidgets.scaleZPair[1].setValue(s.z);

    // Position
    const pos = entity.body.position;
    const polar = cartesianToPolar(pos);
    entityWidgets.latPair[0].value = polar.lat.toFixed(1);
    entityWidgets.latPair[1].setValue(polar.lat);
    entityWidgets.lonPair[0].value = polar.lon.toFixed(1);
    entityWidgets.lonPair[1].setValue(polar.lon);
    entityWidgets.altPair[0].value = polar.alt.toFixed(0);
    entityWidgets.altPair[1].setValue(polar.alt);
    entityWidgets.posX.textContent = scaleToKm(pos.x).toFixed(0);
    entityWidgets.posY.textContent = scaleToKm(pos.y).toFixed(0);
    entityWidgets.posZ.textContent = scaleToKm(pos.z).toFixed(0);

    // Velocity
    entityWidgets.vx.textContent = scaleToKm(entity.velocity.x).toFixed(3);
    entityWidgets.vy.textContent = scaleToKm(entity.velocity.y).toFixed(3);
    entityWidgets.vz.textContent = scaleToKm(entity.velocity.z).toFixed(3);
    entityWidgets.speed.textContent = scaleToKm(entity.velocity.length()).toFixed(3);
    entityWidgets.showVel.checked = entity.vectors.showVelocity;

    // Acceleration
    const fmt = v => scaleToKm(v).toExponential(2);
    entityWidgets.totalAcc.textContent = fmt(entity.accelerations.total.length());
    entityWidgets.gravAcc.textContent = fmt(entity.accelerations.gravity.length());
    entityWidgets.showGrav.checked = entity.vectors.showAccelerationForGravity;
    entityWidgets.dragAcc.textContent = fmt(entity.accelerations.friction.length());
    entityWidgets.showDrag.checked = entity.vectors.showAccelerationForDrag;
    entityWidgets.engineAcc.textContent = fmt(entity.accelerations.engine.length());
    entityWidgets.showEngine.checked = entity.vectors.showAccelerationForEngine;
    entityWidgets.showTotalAcc.checked = entity.vectors.showAcceleration;

    // Trail
    entityWidgets.trailEnabled.checked = entity.trail.enabled;
    entityWidgets.trailStyle.value = entity.trail.style;
    entityWidgets.trailColor.value = entity.trail.color;
    entityWidgets.trailLifetimePair[0].value = entity.trail.lifetime;
    entityWidgets.trailLifetimePair[1].setValue(entity.trail.lifetime);
}

export function refreshEntitySelect() {
    if (!entitySelectRef) return;

    entitySelectOptions.length = 0;
    world.getPhysicalEntities().forEach(ent => {
        entitySelectOptions.push({ value: ent.name, label: ent.name });
    });

    entitySelectRef.updateOptions(entitySelectOptions, currentEntityName);

    if (!currentEntityName && entitySelectOptions.length > 0) {
        currentEntityName = entitySelectOptions[0].value;
        entitySelectRef.value = currentEntityName;
        updateEntityWidgets();
    }
}

export function selectEntity(name) {
    if (entitySelectRef && entitySelectOptions.some(opt => opt.value === name)) {
        entitySelectRef.value = name;
        updateEntityWidgets();
    }
}