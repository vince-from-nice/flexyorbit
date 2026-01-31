import * as THREE from 'three';
import world from '../world.js';
import { ENTITY_TYPES } from '../entity.js';
import { addSubPanel, addCustomSelect, addSlider } from './widgets.js';
import { timeAcceleration } from './interface.js';
import { showTemporaryMessage } from '../utils.js';
import { selectEntity } from './ui_entity.js';

export let selectedSpaceship = null, spaceshipSelect = null;

const spaceshipWidgets = {};

export function createSpaceshipWidgets(spaceshipPanel) {
    spaceshipSelect = addCustomSelect(spaceshipPanel, null, null, [], null, name => {
        selectedSpaceship = world.getEntityByName(name);
        selectEntity(name);
    });

    // Spaceship orientation sub panel
    const orientationPanel = addSubPanel(spaceshipPanel, 'Orientation', false);

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

    const thrustRow = document.createElement('div');
    thrustRow.style.display = 'flex';
    thrustRow.style.gap = '10px';
    thrustRow.style.marginTop = '10px';
    thrustRow.style.alignItems = 'center';
    thrustRow.style.width = '100%';

    const frontBtn = document.createElement('button');
    frontBtn.textContent = '\nFront thrust';
    frontBtn.style.flex = '1.4';
    frontBtn.style.padding = '8px 12px';
    frontBtn.style.fontSize = '13px';
    frontBtn.style.minWidth = '0';

    const backBtn = document.createElement('button');
    backBtn.textContent = 'Back thrust';
    backBtn.style.flex = '1';
    backBtn.style.padding = '8px 10px';
    backBtn.style.fontSize = '12px';
    backBtn.style.minWidth = '0';

    thrustRow.appendChild(frontBtn);
    thrustRow.appendChild(backBtn);
    enginePanel.appendChild(thrustRow);

    frontBtn.addEventListener('mousedown', () => {
        if (selectedSpaceship) {
            selectedSpaceship.thrustDirection = 1;
            frontBtn.classList.add('thrust-active');
            backBtn.classList.remove('thrust-active');
        }
    });

    frontBtn.addEventListener('mouseup', () => {
        if (selectedSpaceship) {
            selectedSpaceship.thrustDirection = 0;
            frontBtn.classList.remove('thrust-active');
        }
    });

    frontBtn.addEventListener('mouseleave', () => {
        if (selectedSpaceship && selectedSpaceship.thrustDirection === 1) {
            selectedSpaceship.thrustDirection = 0;
            frontBtn.classList.remove('thrust-active');
        }
    });

    backBtn.addEventListener('mousedown', () => {
        if (selectedSpaceship) {
            selectedSpaceship.thrustDirection = -1;
            backBtn.classList.add('thrust-active');
            frontBtn.classList.remove('thrust-active');
        }
    });

    backBtn.addEventListener('mouseup', () => {
        if (selectedSpaceship) {
            selectedSpaceship.thrustDirection = 0;
            backBtn.classList.remove('thrust-active');
        }
    });

    backBtn.addEventListener('mouseleave', () => {
        if (selectedSpaceship && selectedSpaceship.thrustDirection === -1) {
            selectedSpaceship.thrustDirection = 0;
            backBtn.classList.remove('thrust-active');
        }
    });

    document.addEventListener('keydown', e => {
        if (!selectedSpaceship || document.activeElement?.tagName === 'INPUT') return;
        const δ = 4;
        let changed = false;
        switch (e.key) {
            case '4': euler.y += THREE.MathUtils.degToRad(δ); changed = true; break;
            case '6': euler.y -= THREE.MathUtils.degToRad(δ); changed = true; break;
            case '8': euler.x += THREE.MathUtils.degToRad(δ); changed = true; break;
            case '5': euler.x -= THREE.MathUtils.degToRad(δ); changed = true; break;
            case '7': euler.z -= THREE.MathUtils.degToRad(δ); changed = true; break;
            case '9': euler.z += THREE.MathUtils.degToRad(δ); changed = true; break;
            case 'Enter':
                if (selectedSpaceship) {
                    selectedSpaceship.thrustDirection = 1;
                    frontBtn.classList.add('thrust-active');
                    backBtn.classList.remove('thrust-active');
                }
                break;
            case '0':
                if (selectedSpaceship) {
                    selectedSpaceship.thrustDirection = -1;
                    backBtn.classList.add('thrust-active');
                    frontBtn.classList.remove('thrust-active');
                }
                break;
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
            case 'Enter':
                if (selectedSpaceship) {
                    selectedSpaceship.thrustDirection = 0;
                    frontBtn.classList.remove('thrust-active');
                }
                break;
            case '0':
                if (selectedSpaceship) {
                    selectedSpaceship.thrustDirection = 0;
                    backBtn.classList.remove('thrust-active');
                }
                break;
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
        ships.unshift({value:'', label:'Select a spaceship'})
    spaceshipSelect.updateOptions(ships, selectedSpaceship?.name);
}
