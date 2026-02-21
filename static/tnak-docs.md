# TNAK Script
TNAK Script is a minimal implementation of DuckyScript.

**IMPORTANT** This editor will NOT save your work! Always remember to save your script to a text file before closing this page.

Remember that TNAK will start typing as soon as programming has finished.

---

### REM
REM is a remark (a comment). Anything after REM will be ignored.

Example:
```
REM This will be ignored by TNAK
STRING But this will be typed
```

---

### STRING
TNAK will type the text in the string.

Example:
```
REM Type the link to this page then press enter
STRING https://verumignis.com/tnak
ENTER
```

---

### Single Keys
Any line that does not start with a command is considered a single key. TNAK will type the key once. This will not automatically apply any modifier keys, for example **A** will be typed as **a** unless **SHIFT** is held.

Example:
```
GUI
DELAY 250
STRING kicad
DELAY 250
ENTER
```

---

### DELAY
TNAK will wait the specified time in miliseconds.

Maximum value is 65535.

Example:
```
REM Open the calculator
HOLD GUI
R
RELEASE GUI

REM Wait for 0.5s
DELAY 500

STRING calculator.exe
ENTER
```

---

### SPEED
The amount of time between each keypress in miliseconds.

This is 20ms by default. Maximum value is 65535.

Example:
```
SPEED 20
STRING This is typed very fast!
SPEED 250
STRING And this is typed very slow...
```

---

### HOLD & RELEASE
TNAK will HOLD the specified key down until RELEASEd.

A maximum of 5 normal keys plus all modifiers can be held at once.

STRING will override a held SHIFT.

Example:
```
HOLD CTRL
C
DELAY 1000
V
RELEASE CTRL
```