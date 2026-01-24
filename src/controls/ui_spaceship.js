import * as THREE from 'three';
import world from '../world.js';
import { ENTITY_TYPES } from '../entity.js';
import { addSubPanel, addCustomSelect, addSlider } from './widgets.js';
import { timeAcceleration } from './interface.js';
import { showTemporaryMessage } from '../utils.js';

export let selectedSpaceship = null, spaceshipSelect = null;

const spaceshipWidgets = {};

export function createSpaceshipWidgets(spaceshipPanel) {
    spaceshipSelect = addCustomSelect(spaceshipPanel, 'Select spaceship', null, [], null, name => {
        selectedSpaceship = world.getEntityByName(name);
    });

    // Spaceship orientation sub panel
    const orientationPanel = addSubPanel(spaceshipPanel, 'Orientation', true);

    const euler = new THREE.Euler(0, 0, 0, 'YXZ');
    const quat = new THREE.Quaternion();

    spaceshipWidgets.yaw = addSlider(orientationPanel, 'Yaw (°)', -180, 180, 0, 1, v => {
        if (!selectedSpaceship) return;
        euler.y = THREE.MathUtils.degToRad(v);
        quat.setFromEuler(euler);
        selectedSpaceship.body.quaternion.copy(quat).normalize();
    });

    spaceshipWidgets.pitch = addSlider(orientationPanel, 'Pitch (°)', -89, 89, 0, 1, v => {
        if (!selectedSpaceship) return;
        euler.x = THREE.MathUtils.degToRad(v);
        quat.setFromEuler(euler);
        selectedSpaceship.body.quaternion.copy(quat).normalize();
    });

    spaceshipWidgets.roll = addSlider(orientationPanel, 'Roll (°)', -180, 180, 0, 1, v => {
        if (!selectedSpaceship) return;
        euler.z = THREE.MathUtils.degToRad(v);
        quat.setFromEuler(euler);
        selectedSpaceship.body.quaternion.copy(quat).normalize();
    });

    // Spaceship engine sub panel
    const enginePanel = addSubPanel(spaceshipPanel, 'Main engine', true);

    spaceshipWidgets.enginePower = addSlider(enginePanel, 'Engine power (%)', 0, 100, 50, 1, v => {
        if (selectedSpaceship) selectedSpaceship.thrustPower = v / 100;
    });

    const thrustBtn = document.createElement('button');
    thrustBtn.textContent = 'Hold to Thrust';
    thrustBtn.style.marginTop = '8px';
    thrustBtn.addEventListener('mousedown', () => {
        if (false && timeAcceleration !== 1) {
            showTemporaryMessage('Set time accel to ×1 first');
            return;
        }
        if (selectedSpaceship) selectedSpaceship.thrusting = true;
    });
    thrustBtn.addEventListener('mouseup', () => { if (selectedSpaceship) selectedSpaceship.thrusting = false; });
    thrustBtn.addEventListener('mouseleave', () => { if (selectedSpaceship) selectedSpaceship.thrusting = false; });
    enginePanel.appendChild(thrustBtn);

    document.addEventListener('keydown', e => {
        if (!selectedSpaceship || document.activeElement?.tagName === 'INPUT') return;
        const δ = 4;
        let changed = false;
        switch (e.key) {
            case '4': euler.y += THREE.MathUtils.degToRad(δ); changed = true; break;
            case '6': euler.y -= THREE.MathUtils.degToRad(δ); changed = true; break;
            case '8': euler.x += THREE.MathUtils.degToRad(δ); changed = true; break;
            case '2': euler.x -= THREE.MathUtils.degToRad(δ); changed = true; break;
            case '7': euler.z -= THREE.MathUtils.degToRad(δ); changed = true; break;
            case '9': euler.z += THREE.MathUtils.degToRad(δ); changed = true; break;
            case '5': if (selectedSpaceship) selectedSpaceship.thrusting = true; break;
        }
        if (changed) {
            quat.setFromEuler(euler);
            selectedSpaceship.body.quaternion.copy(quat).normalize();
            updateSpaceshiptWidgets();
        }
    });

    document.addEventListener('keyup', e => {
        if (!selectedSpaceship || document.activeElement?.tagName === 'INPUT') return;
        switch (e.key) {
            case '5': if (selectedSpaceship) selectedSpaceship.thrusting = false; break;
        }
    });
}

export function updateSpaceshiptWidgets() {
    if (!selectedSpaceship) return;
    const euler = new THREE.Euler(0, 0, 0, 'YXZ');
    euler.setFromQuaternion(selectedSpaceship.body.quaternion);
    const yawValue = THREE.MathUtils.radToDeg(euler.y).toFixed(1);
    spaceshipWidgets.yaw[0].value = yawValue;
    spaceshipWidgets.yaw[1].value = yawValue;
    const pitchValue = THREE.MathUtils.radToDeg(euler.x).toFixed(1);
    spaceshipWidgets.pitch[0].value = pitchValue;
    spaceshipWidgets.pitch[1].value = pitchValue;
    const rollValue = THREE.MathUtils.radToDeg(euler.z).toFixed(1);
    spaceshipWidgets.roll[0].value = rollValue;
    spaceshipWidgets.roll[1].value = rollValue;
}

export function refreshSpaceshipSelect() {
    if (!spaceshipSelect) return;
    const ships = world.getEntitiesByType(ENTITY_TYPES.SPACESHIP)
        .map(e => ({ value: e.name, label: e.name }));
    spaceshipSelect.updateOptions(ships, selectedSpaceship?.name);
}
