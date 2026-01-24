import world from '../world.js';
import { scaleToKm } from '../constants.js';
import { cartesianToPolar, polarToCartesian } from '../utils.js';
import { TRAIL_STYLES } from '../scene/trails.js';
import { addSlider, addCheckbox, addCustomSelect, addSubPanel, addReadOnly, addEditableText } from './widgets.js'
import { selectCameraTarget } from './camera.js'

let currentEntityName = null, entityPanelContainer = null, entitySelectRef = null;
const entityWidgets = {}, entitySelectOptions = [];;

export function createEntityWidgets(entityPanel) {
    entitySelectRef = addCustomSelect(entityPanel, 'Select an object or press \'t\' to switch', null, [], null,
        name => {
            currentEntityName = name;
            rebuildEntityPanel();
            selectCameraTarget(name);
        }
    );

    window.addEventListener('keydown', (e) => {
        if (e.code === 'KeyT' && !e.repeat && !e.ctrlKey && !e.altKey && !e.metaKey) {
            const currentEntityIndex = entitySelectOptions.findIndex(e => e.value === currentEntityName);
            const nextEntityIndex = currentEntityIndex < entitySelectOptions.length - 1 ? currentEntityIndex + 1 : 0;
            entitySelectRef.value = entitySelectOptions[nextEntityIndex].value;
        }
    });

    window.addEventListener('keydown', (e) => {
        if (e.code === 'KeyR' && !e.repeat && !e.ctrlKey && !e.altKey && !e.metaKey) {
            const currentEntityIndex = entitySelectOptions.findIndex(e => e.value === currentEntityName);
            const nextEntityIndex = currentEntityIndex > 0 ? currentEntityIndex - 1 : entitySelectOptions.length - 1;
            entitySelectRef.value = entitySelectOptions[nextEntityIndex].value;
        }
    });

    entityPanelContainer = document.createElement('div');
    entityPanel.appendChild(entityPanelContainer);
}

export function rebuildEntityPanel() {
    entityPanelContainer.innerHTML = '';
    if (!currentEntityName) return;

    const entity = world.getEntityByName(currentEntityName);
    if (!entity) return;

    entityWidgets.current = entity;

    // ── Infos panel ───────────────────────────────────────────────
    const infosPanel = addSubPanel(entityPanelContainer, 'Infos', false);
    addReadOnly(infosPanel, 'Type', entity.type);
    entityWidgets.status = addReadOnly(infosPanel, 'Status', entity.isFreeFalling ? 'Flying' : 'Crashed', entity.isFreeFalling ? 'rgba(37, 233, 40, 1)' : '#f44');
    addEditableText(infosPanel, 'Description', entity.description, v => entity.description = v);
    addSlider(infosPanel, 'Mass (kg)', 1, 10000, entity.mass, 1, v => entity.mass = v, { logarithmic: true });
    addSlider(infosPanel, 'Drag coeff.', 0.0001, 0.01, entity.dragCoefficient, 0.0001, v => entity.dragCoefficient = v);

    // ────────────────── Scaling panel ─────────────────────────────────────
    const scalingPanel = addSubPanel(entityPanelContainer, 'Scaling', false);
    const currentScale = entity.body.scale;
    const initialGlobal = (currentScale.x + currentScale.y + currentScale.z) / 3;
    let xSlider, ySlider, zSlider;
    addSlider(
        scalingPanel, 'Global scale', 1, 100000, initialGlobal, 1,
        value => {
            entity.body.scale.set(value, value, value);
            if (xSlider) xSlider.setValue(value);
            if (ySlider) ySlider.setValue(value);
            if (zSlider) zSlider.setValue(value);
        },
        { logarithmic: true }
    );
    addSlider(scalingPanel, 'Scale X', 1, 100000, currentScale.x, 1,
        value => { entity.body.scale.x = value; }, { logarithmic: true }
    );
    xSlider = scalingPanel.querySelectorAll('input[type="range"]')[1];

    addSlider(scalingPanel, 'Scale Y', 1, 100000, currentScale.y, 1,
        value => { entity.body.scale.y = value; }, { logarithmic: true }
    );
    ySlider = scalingPanel.querySelectorAll('input[type="range"]')[2];

    addSlider(scalingPanel, 'Scale Z', 1, 100000, currentScale.z, 1,
        value => { entity.body.scale.z = value; }, { logarithmic: true }
    );
    zSlider = scalingPanel.querySelectorAll('input[type="range"]')[3];

    // ── Position panel ────────────────────────────────────────────
    const positionPanel = addSubPanel(entityPanelContainer, 'Position', true);

    const polarGroup = addSubPanel(positionPanel, 'Earth coords', true);
    const pos = entity.body.position;
    const polar = cartesianToPolar(pos);
    entityWidgets.lat = addSlider(polarGroup, 'Latitude (°)', -90, 90, polar.lat, 0.1, updateEntityLat);
    entityWidgets.lon = addSlider(polarGroup, 'Longitude (°)', -180, 180, polar.lon, 0.1, updateEntityLon);
    entityWidgets.alt = addSlider(polarGroup, 'Altitude (km)', 1, 500000, polar.alt, 1, updateEntityAlt, { logarithmic: true });

    const worldGroup = addSubPanel(positionPanel, 'World coords', true);
    entityWidgets.posX = addReadOnly(worldGroup, 'X (km)', scaleToKm(pos.x).toFixed(0));
    entityWidgets.posY = addReadOnly(worldGroup, 'Y (km)', scaleToKm(pos.y).toFixed(0));
    entityWidgets.posZ = addReadOnly(worldGroup, 'Z (km)', scaleToKm(pos.z).toFixed(0));

    function updateEntityLat(value) {
        const entity = entityWidgets.current;
        if (!entity) return;
        const polar = cartesianToPolar(entity.body.position);
        polar.lat = value;
        entity.body.position.copy(polarToCartesian(polar.lat, polar.lon, polar.alt));
    }

    function updateEntityLon(value) {
        const entity = entityWidgets.current;
        if (!entity) return;
        const polar = cartesianToPolar(entity.body.position);
        polar.lon = value;
        entity.body.position.copy(polarToCartesian(polar.lat, polar.lon, polar.alt));
    }

    function updateEntityAlt(value) {
        const entity = entityWidgets.current;
        if (!entity) return;
        const polar = cartesianToPolar(entity.body.position);
        polar.alt = value;
        entity.body.position.copy(polarToCartesian(polar.lat, polar.lon, polar.alt));
    }

    // ── Velocity panel ────────────────────────────────────────────
    const velocityPanel = addSubPanel(entityPanelContainer, 'Velocity', false);
    entityWidgets.vx = addReadOnly(velocityPanel, 'Vx (km/s)', scaleToKm(entity.velocity.x).toFixed(3));
    entityWidgets.vy = addReadOnly(velocityPanel, 'Vy (km/s)', scaleToKm(entity.velocity.y).toFixed(3));
    entityWidgets.vz = addReadOnly(velocityPanel, 'Vz (km/s)', scaleToKm(entity.velocity.z).toFixed(3));
    entityWidgets.speed = addReadOnly(velocityPanel, 'Speed (km/s)', scaleToKm(entity.velocity.length()).toFixed(3));

    addCheckbox(velocityPanel, 'Show velocity vector', null, entity.vectors.showVelocity, v => {
        entity.vectors.showVelocity = v;
    });

    // ── Acceleration panel ───────────────────────────────────────
    const accelerationPanel = addSubPanel(entityPanelContainer, 'Acceleration', false);
    const fmt = v => v.toExponential(2);

    const container = document.createElement('div');
    Object.assign(container.style, {
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
        margin: '2px 0',
        width: '100%'
    });
    accelerationPanel.appendChild(container);

    entityWidgets.totalAcc = addReadOnly(container, 'Total (km/s²)', fmt(scaleToKm(entity.accelerations.total.length())));

    const makeRow = () => {
        const row = document.createElement('div');
        Object.assign(row.style, {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
            minWidth: '100%',
            boxSizing: 'border-box'
        });
        container.appendChild(row);
        return row;
    };

    const gravRow = makeRow();
    entityWidgets.gravAcc = addReadOnly(gravRow, '→ Gravity (km/s²)', fmt(scaleToKm(entity.accelerations.gravity.length())));
    addCheckbox(gravRow, null, null, entity.vectors.showAccelerationForGravity, v => { entity.vectors.showAccelerationForGravity = v; });

    const dragRow = makeRow();
    entityWidgets.dragAcc = addReadOnly(dragRow, '→ Drag (km/s²)', fmt(scaleToKm(entity.accelerations.friction.length())));
    addCheckbox(dragRow, null, null, entity.vectors.showAccelerationForDrag, v => { entity.vectors.showAccelerationForDrag = v; });

    const engineRow = makeRow();
    entityWidgets.engineAcc = addReadOnly(engineRow, '→ Engine (km/s²)', fmt(scaleToKm(entity.accelerations.engine.length())));
    addCheckbox(engineRow, null, null, entity.vectors.showAccelerationForEngine, v => { entity.vectors.showAccelerationForEngine = v; });

    const totalRow = makeRow();
    const spacer = document.createElement('div');
    spacer.style.width = '200px'; // fake space to align the global checkbox with others
    spacer.style.visibility = 'hidden';
    totalRow.style.marginTop = '10px';
    totalRow.appendChild(spacer);
    addCheckbox(totalRow, 'Show total acceleration vector', null, entity.vectors.showAcceleration, v => { entity.vectors.showAcceleration = v; });

    // ── Trail panel ───────────────────────────────────────────────
    const trailPanel = addSubPanel(entityPanelContainer, 'Trail display', false);

    entityWidgets.trailEnabled = addCheckbox(trailPanel, 'Enabled', null, entity.trail.enabled, enabled => {
        if (entity.trail) {
            entity.trail.enabled = enabled;
        }
    });

    entityWidgets.trailStyle = addCustomSelect(
        trailPanel,
        'Style and color',
        null,
        TRAIL_STYLES,
        entity.trail.style,
        newStyle => entity.trail.updateTrailStyle(newStyle)
    );
    const colorInput = document.createElement('input');
    colorInput.type = 'color';
    colorInput.value = entity.trail.color;
    colorInput.onchange = () => {
        entity.trail.updateTrailColor(colorInput.value);
    };
    trailPanel.appendChild(colorInput);
    addSlider(trailPanel, 'Lifetime (seconds)', 0, 100, entity.trail.lifetime, 1, v => entity.trail.lifetime = v);
}

export function updateEntityWidgets() {
    if (!currentEntityName) return;
    const e = world.getEntityByName(currentEntityName);
    if (!e) return;

    entityWidgets.status.textContent = e.isFreeFalling ? 'Flying' : 'Crashed';
    entityWidgets.status.style.color = e.isFreeFalling ? 'rgba(37, 233, 40, 1)' : '#f44';

    // Position
    const pos = e.body.position;
    entityWidgets.posX.textContent = scaleToKm(pos.x).toFixed(0);
    entityWidgets.posY.textContent = scaleToKm(pos.y).toFixed(0);
    entityWidgets.posZ.textContent = scaleToKm(pos.z).toFixed(0);
    const polarPos = cartesianToPolar(pos);
    entityWidgets.lat[0].value = polarPos.lat.toFixed(1);
    entityWidgets.lon[0].value = polarPos.lon.toFixed(1);
    entityWidgets.alt[0].value = polarPos.alt.toFixed(0);
    entityWidgets.lat[1].value = polarPos.lat.toFixed(1);
    entityWidgets.lon[1].value = polarPos.lon.toFixed(1);
    entityWidgets.alt[1].setValue(polarPos.alt);

    // Speed
    entityWidgets.vx.textContent = scaleToKm(e.velocity.x).toFixed(3);
    entityWidgets.vy.textContent = scaleToKm(e.velocity.y).toFixed(3);
    entityWidgets.vz.textContent = scaleToKm(e.velocity.z).toFixed(3);
    entityWidgets.speed.textContent = scaleToKm(e.velocity.length()).toFixed(3);

    // Accelerations
    const s = scaleToKm;
    entityWidgets.totalAcc.textContent = s(e.accelerations.total.length()).toExponential(2);
    entityWidgets.gravAcc.textContent = s(e.accelerations.gravity.length()).toExponential(2);
    entityWidgets.dragAcc.textContent = s(e.accelerations.friction.length()).toExponential(2);
    entityWidgets.engineAcc.textContent = s(e.accelerations.engine.length()).toExponential(2);
}

export function refreshEntitySelect() {
    if (!entitySelectRef) return;
    entitySelectOptions.length = 0;
    for (const entity of world.getPhysicalEntities()) {
        entitySelectOptions.push({ value: entity.name, label: entity.name })
    }
    entitySelectRef.updateOptions(entitySelectOptions, currentEntityName);
    if (!world.getEntityByName(currentEntityName)) {
        currentEntityName = entitySelectOptions[0]?.value || null;
        rebuildEntityPanel();
    }
}

export function selectEntity(entityName) {
    if (entitySelectRef) {
        entitySelectRef.value = entityName;
    }
}
