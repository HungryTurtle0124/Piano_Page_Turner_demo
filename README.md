# Piano Page Turner Demo

A web-based eye-controlled PDF music page turner for piano practice and performance.

This project is an experimental hands-free page turning system that lets a pianist turn sheet music pages without using their hands. Instead of tapping the screen or using a pedal, the user can turn PDF pages using eye gaze through the device camera.

The goal of this project is to make page turning more natural while playing piano, especially when both hands need to stay on the keyboard.

## What it does

- Opens a PDF of sheet music in the browser
- Uses the camera to track facial landmarks and estimate gaze direction
- Lets the user turn pages by looking in a chosen direction and holding briefly
- Supports hands-free page turning for music practice
- Includes calibration and adjustable sensitivity settings
- Allows CSV recording of feature data for testing and improvement

## Why I made this

When playing piano, stopping to touch a screen or flip paper can interrupt the performance. I wanted to build a system that could turn music pages in a more seamless way, without requiring hand movement.

This project explores whether gaze interaction in a browser can be practical enough for real-world music use, especially on a tablet-sized device.

## Features

- **PDF viewer** for digital sheet music
- **Eye-gaze based page turning**
- **Camera start/stop controls**
- **Calibration button** to center the gaze baseline
- **Adjustable threshold**
- **Adjustable hold time**
- **Adjustable cooldown**
- **Auto turn toggle**
- **CSV feature recording** for debugging and future model improvement
- **Debug display** for development/testing

## How it works

The browser accesses the front camera and detects facial landmarks. From those landmarks, the app estimates gaze-related movement. When the detected gaze passes a chosen threshold and stays there for a set amount of time, the app triggers a page turn.

To reduce accidental turns, the app uses:
- a calibration step
- a hold time requirement
- a cooldown period after each turn

## Tech stack

- HTML
- JavaScript
- Browser camera APIs
- PDF rendering in the browser
- Face / eye landmark tracking in the browser

## Current status

This is still a work-in-progress prototype.

The main focus right now is:
- making gaze detection more stable
- reducing false page turns
- improving usability for piano playing
- making the system work better on tablet devices such as iPad

## How to run

### Option 1: Use GitHub Pages
Open the deployed site in a browser that allows camera access over HTTPS.

### Option 2: Run locally
1. Clone this repository
2. Open the project in a local web server
3. Load the page in a browser
4. Allow camera permission
5. Upload a PDF and test the page turning controls

> Note: On some devices, camera access may require HTTPS rather than a plain local file.

## Basic usage

1. Open the app
2. Upload your sheet music PDF
3. Start the camera
4. Calibrate while looking at the center
5. Adjust threshold, hold time, and cooldown if needed
6. Play piano and use your gaze to trigger page turns

## Challenges

Some of the main challenges in this project are:

- distinguishing eye movement from head movement
- avoiding accidental triggers while reading music naturally
- making the interaction feel reliable enough during actual performance
- getting stable behavior across different devices and lighting conditions

## Future improvements

- Better gaze estimation accuracy
- Support for left/right or up/down gesture options
- Improved calibration flow
- Cleaner file structure instead of a single HTML file
- More visual feedback for gaze direction
- Better mobile/tablet optimization
- Personalized sensitivity profiles
- Smarter filtering and smoothing for noisy gaze input
