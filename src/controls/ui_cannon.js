import { addSlider, addSubPanel } from './widgets.js'
import { updateCannonWithParams, fireCannonball, cannonParams } from '../scene/cannon.js';

let cannonLatDisplay, cannonLonDisplay, cannonAltDisplay, cannonAzDisplay, cannonElDisplay;
let cannonLatSlider, cannonLonSlider, cannonAltSlider, cannonAzSlider, cannonElSlider;

export function createCannonWidgets(cannonPanel) {
    // Cannon position sub panel
    const cannonPositionPanel = addSubPanel(cannonPanel, 'Position', false);
    [cannonLatDisplay, cannonLatSlider] = addSlider(cannonPositionPanel, 'Latitude (°)', -90, 90, cannonParams.lat, 0.1, value => {
        cannonParams.lat = value;
        updateCannonWithParams();
    });
    [cannonLonDisplay, cannonLonSlider] = addSlider(cannonPositionPanel, 'Longitude (°)', -180, 180, cannonParams.lon, 0.1, value => {
        cannonParams.lon = value;
        updateCannonWithParams();
    });
    [cannonAltDisplay, cannonAltSlider] = addSlider(cannonPositionPanel, 'Altitude (km)', 0, 3000, cannonParams.altitude, 1, value => {
        cannonParams.altitude = value;
        updateCannonWithParams();
    });
    [cannonAzDisplay, cannonAzSlider] = addSlider(cannonPositionPanel, 'Azimuth (°)', 0, 360, cannonParams.azimuth, 1, value => {
        cannonParams.azimuth = value;
        updateCannonWithParams();
    });

    // Canon fire sub panel
    const cannonFirePanel = addSubPanel(cannonPanel, 'Fire control', true);
    [cannonElDisplay, cannonElSlider] = addSlider(cannonFirePanel, 'Elevation (°)', 0, 90, cannonParams.elevation, 1, value => {
        cannonParams.elevation = value;
        updateCannonWithParams();
    });
    addSlider(cannonFirePanel, 'Muzzle speed (km/s)', 0, 15, cannonParams.speed, 0.01, value => {
        cannonParams.speed = value;
    });
    const fireButton = document.createElement('button');
    fireButton.textContent = 'Fire the cannonball !';
    fireButton.classList.add('fire-button');
    fireButton.addEventListener('click', () => {
        fireCannonball();
    });
    window.addEventListener('keydown', (e) => {
        if (e.key == " " || e.code == "Space") {
            fireCannonball();
        }
    });
    cannonFirePanel.appendChild(fireButton);
}

export function updateCannonWidgets() {
    if (cannonLatDisplay && cannonLatSlider) {
        cannonLatDisplay.value = cannonParams.lat.toFixed(1);
        cannonLatSlider.value = cannonParams.lat.toFixed(1);
        //cannonLatSlider.dispatchEvent(new Event('input'));
    }
    if (cannonLonDisplay && cannonLonSlider) {
        cannonLonDisplay.value = cannonParams.lon.toFixed(1);
        cannonLonSlider.value = cannonParams.lon.toFixed(1);
        //cannonLonSlider.dispatchEvent(new Event('input'));
    }
    if (cannonAltDisplay && cannonAltSlider) {
        cannonAltDisplay.value = cannonParams.altitude.toFixed(0);
        cannonAltSlider.value = cannonParams.altitude.toFixed(0);
        //cannonAltSlider.dispatchEvent(new Event('input'));
    }
    if (cannonAzDisplay && cannonAzSlider) {
        cannonAzDisplay.value = cannonParams.azimuth.toFixed(0);
        cannonAzSlider.value = cannonParams.azimuth.toFixed(0);
        //cannonAzSlider.dispatchEvent(new Event('input'));
    }
    if (cannonElDisplay && cannonElSlider) {
        cannonElDisplay.value = cannonParams.elevation.toFixed(0);
        cannonElSlider.value = cannonParams.elevation.toFixed(0);
        //cannonElSlider.dispatchEvent(new Event('input'));
    }
}