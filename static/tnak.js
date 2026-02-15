let dfu = new usbDfuDevice();

const keyMap = {
  'A':0x04,'B':0x05,'C':0x06,'D':0x07,'E':0x08,'F':0x09,'G':0x0A,'H':0x0B,'I':0x0C,'J':0x0D,
  'K':0x0E,'L':0x0F,'M':0x10,'N':0x11,'O':0x12,'P':0x13,'Q':0x14,'R':0x15,'S':0x16,'T':0x17,
  'U':0x18,'V':0x19,'W':0x1A,'X':0x1B,'Y':0x1C,'Z':0x1D,

  '1':0x1E,'2':0x1F,'3':0x20,'4':0x21,'5':0x22,'6':0x23,'7':0x24,'8':0x25,'9':0x26,'0':0x27,

  'ENTER':0x28,'ESCAPE':0x29,'BACKSPACE':0x2A,'TAB':0x2B,'SPACE':0x2C,'CAPSLOCK':0x39,

  ' ':0x2C,'-':0x2D,'=':0x2E,'[':0x2F,']':0x30,'\\':0x31,';':0x33,'\'':0x34,'`':0x35,',':0x36,'.':0x37,'/':0x38,

  'F1':0x3A,'F2':0x3B,'F3':0x3C,'F4':0x3D,'F5':0x3E,'F6':0x3F,
  'F7':0x40,'F8':0x41,'F9':0x42,'F10':0x43,'F11':0x44,'F12':0x45,

  'PRINTSCREEN':0x46,'SCROLLLOCK':0x47,'PAUSE':0x48,
  'INSERT':0x49,'HOME':0x4A,'PAGEUP':0x4B,'DELETE':0x4C,'END':0x4D,'PAGEDOWN':0x4E,
  'RIGHTARROW':0x4F,'LEFTARROW':0x50,'DOWNARROW':0x51,'UPARROW':0x52,

  'CTRL':0xE0,'CONTROL':0xE0,'SHIFT':0xE1,'ALT':0xE2,'GUI':0xE3,'WINDOWS':0xE3
};

const shiftMap = {
  '!':['1'], '@':['2'], '#':['3'], '$':['4'], '%':['5'],
  '^':['6'], '&':['7'], '*':['8'], '(':['9'], ')':['0'],
  '_':['-'], '+':['='], '{':['['], '}':[']'],
  '|':['\\'], ':':[';'], '"':['\''],
  '~':['`'], '<':[','], '>':['.'], '?':['/']
};

// Reverse map for decoding SHIFT characters
const shiftMapInverse = {};
for (const [shifted, baseArr] of Object.entries(shiftMap)) {
  shiftMapInverse[baseArr[0]] = shifted;
}


const writeButton = document.getElementById('write');
const statusEl = document.querySelector('.tnak-status .status-text');

function setStatus(message) {
  statusEl.textContent = message;
  console.log("[STATUS]", message);
}

document.getElementById('write').onclick = async () => {
  writeButton.disabled = true;

  setStatus(`Downloading Firmware Image`);

  let scriptData;
  try {
    const scriptText = document.getElementById('script').value;
    scriptData = encode(scriptText); // your encode() function should return Uint8Array
  } catch (err) {
    setStatus(`Invalid syntax: ${err.message}`);
    writeButton.disabled = false;
    return;
  }

  // Check script size
  const maxScriptSize = 16 * 1024; // 16 KB
  if (scriptData.length > maxScriptSize) {
    setStatus(`Script too large: ${scriptData.length} bytes, max is ${maxScriptSize} bytes`);
    writeButton.disabled = false;
    return;
  }

  try {
    // Fetch TNAK.bin
    const response = await fetch("/TNAK.bin");
    const fileArr = new Uint8Array(await response.arrayBuffer());

    // Make sure the firmware fits in the lower 16 KB
    const maxFirmwareSize = 16 * 1024; // 16 KB
    if (fileArr.length > maxFirmwareSize) {
      setStatus(`Firmware too large: ${fileArr.length} bytes, max is ${maxFirmwareSize} bytes`);
      writeButton.disabled = false;
      return;
    }

    // Create a full 32 KB flash buffer
    const flashBuffer = new Uint8Array(32 * 1024); // 32 KB total flash
    flashBuffer.set(fileArr, 0); // lower 16 KB: firmware
    flashBuffer.set(scriptData, 16 * 1024); // upper 16 KB: encoded script

    let dfu = new usbDfuDevice();

    await dfu.runUpdateSequence(flashBuffer, 0x8000, 1024);

    setStatus("Write successful!");

  } catch (err) {
    setStatus(`Write failed: ${err.message}`);
    writeButton.disabled = false;
  }
};

function dfuStatusHandler(status) {
    setStatus(status);
}

function dfuProgressHandler(value) {
    const bar = document.querySelector('.tnak-status .progress-bar');
    if (bar) bar.style.width = `${value}%`;
}

function dfuDisconnectHandler() {
    document.querySelector('.tnak-status .progress-bar').style.width = '0%';
    writeButton.disabled = false;
}

function encode(scriptText) {
  const out = [];
  const lines = scriptText.split('\n');

  for (let lineNum = 0; lineNum < lines.length; lineNum++) {
    let l = lines[lineNum].trim();
    if (!l || l.toUpperCase().startsWith('REM')) continue;

    const parts = l.split(/\s+/);
    const cmd = parts[0].toUpperCase();

    switch (cmd) {
      case 'SPEED': {
        const v = parseInt(parts[1]);
        if (isNaN(v) || v < 0 || v > 255)
          throw new Error(`Line ${lineNum + 1}: Invalid SPEED value`);
        out.push(0x01, v);
        break;
      }

      case 'DELAY': {
        const v = parseInt(parts[1]);
        if (isNaN(v) || v < 0 || v > 255)
          throw new Error(`Line ${lineNum + 1}: Invalid DELAY value`);
        out.push(0x02, v);
        break;
      }

      case 'HOLD': {
        const key = keyMap[parts[1].toUpperCase()];
        if (key === undefined) throw new Error(`Line ${lineNum + 1}: Unknown key '${parts[1]}'`);
        out.push(0x03, key);
        break;
      }

      case 'RELEASE': {
        const key = keyMap[parts[1].toUpperCase()];
        if (key === undefined) throw new Error(`Line ${lineNum + 1}: Unknown key '${parts[1]}'`);
        out.push(0x04, key);
        break;
      }

      case 'STRING': {
        const text = l.slice(7); // after "STRING "
        if (text.length > 255)
          throw new Error(`Line ${lineNum + 1}: STRING too long (max 255)`);
        out.push(0x05, text.length);
        for (const char of text) out.push(char.charCodeAt(0));
        break;
      }

      default: {
        // Treat unknown commands as single keypresses like ENTER, TAB, ESC, etc.
        const key = keyMap[cmd];
        if (key === undefined) throw new Error(`Line ${lineNum + 1}: Unknown command or key '${cmd}'`);
        out.push(0x06, key); // single keypress command
        break;
      }
    }
  }

  return new Uint8Array(out);
}



function keyByCode(code) {
  for (const [k, v] of Object.entries(keyMap)) {
    if (v === code && k.length === 1) return k;
  }
  return null;
}

function name(code) {
  return Object.keys(keyMap).find(k => keyMap[k] === code) || 'UNKNOWN';
}
