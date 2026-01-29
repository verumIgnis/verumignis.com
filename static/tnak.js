let device;

const keyMap = {
  'A':0x04,'B':0x05,'C':0x06,'D':0x07,'E':0x08,'F':0x09,'G':0x0A,'H':0x0B,'I':0x0C,'J':0x0D,
  'K':0x0E,'L':0x0F,'M':0x10,'N':0x11,'O':0x12,'P':0x13,'Q':0x14,'R':0x15,'S':0x16,'T':0x17,
  'U':0x18,'V':0x19,'W':0x1A,'X':0x1B,'Y':0x1C,'Z':0x1D,

  '1':0x1E,'2':0x1F,'3':0x20,'4':0x21,'5':0x22,'6':0x23,'7':0x24,'8':0x25,'9':0x26,'0':0x27,

  'ENTER':0x28,'ESCAPE':0x29,'BACKSPACE':0x2A,'TAB':0x2B,'SPACE':0x2C,'CAPSLOCK':0x39,

  '-':0x2D,'=':0x2E,'[':0x2F,']':0x30,'\\':0x31,';':0x33,'\'':0x34,'`':0x35,',':0x36,'.':0x37,'/':0x38,

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

const statusEl = document.querySelector('.tnak-status');
function setStatus(message) {
  statusEl.textContent = message;
  console.log("[STATUS]", message);
}

document.getElementById('connect').onclick = async () => {
  try {
    setStatus('Connecting to device...');
    device = await navigator.usb.requestDevice({ filters: [{ vendorId: 0xCAFE }] });
    await device.open();
    await device.selectConfiguration(1);
    await device.claimInterface(0);
    setStatus(`Device connected: vendorId=0x${device.vendorId.toString(16)}, productId=0x${device.productId.toString(16)}`);
  } catch (err) {
    setStatus(`Connection failed: ${err.message}`);
  }
};

document.getElementById('write').onclick = async () => {
  if (!device) {
    setStatus("Write failed: no device connected");
    return;
  }

  let payload;
  try {
    payload = encode(document.getElementById('script').value);
  } catch (err) {
    setStatus(`Invalid syntax: ${err.message}`);
    return;
  }

  try {
    const buf = new Uint8Array(3 + payload.length);
    buf[0] = 0x02;
    buf[1] = payload.length & 0xFF;
    buf[2] = payload.length >> 8;
    buf.set(payload, 3);

    await device.transferOut(1, buf);
    setStatus(`Write successful: ${payload.length} bytes sent`);
  } catch (err) {
    setStatus(`Write failed: ${err.message}`);
  }
};

document.getElementById('read').onclick = async () => {
  if (!device) {
    setStatus("Read failed: no device connected");
    return;
  }

  try {
    await device.transferOut(1, new Uint8Array([0x01]));
    const r = await device.transferIn(1, 512);
    const d = new Uint8Array(r.data.buffer);
    document.getElementById('script').value = decode(d.slice(3, 3 + (d[1] | d[2]<<8)));
    setStatus(`Read successful: ${d.length - 3} bytes received`);
  } catch (err) {
    setStatus(`Read failed: ${err.message}`);
  }
};

function encode(scriptText) {
  const out = [];
  const lines = scriptText.split('\n');

  for (let lineNum = 0; lineNum < lines.length; lineNum++) {
    let l = lines[lineNum].trim();
    if (!l || l.toUpperCase().startsWith('REM')) continue;

    const parts = l.split(/\s+/);
    const cmd = parts[0].toUpperCase();

    if (cmd === 'SPEED') {
      const v = parseInt(parts[1]);
      if (isNaN(v)) throw new Error(`Line ${lineNum + 1}: Invalid SPEED value`);
      out.push(0x01, v & 0xFF, v >> 8);
    } else if (cmd === 'DELAY') {
      const v = parseInt(parts[1]);
      if (isNaN(v)) throw new Error(`Line ${lineNum + 1}: Invalid DELAY value`);
      out.push(0x20, v & 0xFF, v >> 8);
    } else if (cmd === 'STRING') {
      const text = l.substring(7);
      for (const char of text) {
        if (shiftMap[char]) {
          out.push(0x10, keyMap.SHIFT);              // Hold SHIFT
          out.push(0x12, keyMap[shiftMap[char]]);    // Key down
          out.push(0x13, keyMap[shiftMap[char]]);    // Key up
          out.push(0x11, keyMap.SHIFT);              // Release SHIFT
        } else {
          const key = keyMap[char.toUpperCase()] ?? keyMap[char];
          if (key === undefined) throw new Error(`Line ${lineNum + 1}: Unknown character '${char}'`);
          out.push(0x12, key);
          out.push(0x13, key);
        }
      }
    } else {
      const keys = parts.map(k => keyMap[k.toUpperCase()]).filter(k => k !== undefined);
      if (keys.length === 0) throw new Error(`Line ${lineNum + 1}: Unknown key combination '${l}'`);

      const modifiers = keys.filter(k => k >= 0xE0);
      const normalKeys = keys.filter(k => k < 0xE0);

      for (const k of modifiers) out.push(0x10, k);
      for (const k of normalKeys) {
        out.push(0x12, k);
        out.push(0x13, k);
      }
      for (const k of modifiers.reverse()) out.push(0x11, k);
    }
  }

  return new Uint8Array(out);
}

function decode(data) {
  let i = 0, out = [];
  let heldModifiers = new Set();
  let buffer = '';

  while (i < data.length) {
    const op = data[i++];

    if (op === 0x01) { // SPEED
      if (buffer) { out.push(`STRING ${buffer}`); buffer=''; }
      const value = data[i++] | (data[i++] << 8);
      out.push(`SPEED ${value}`);
    } else if (op === 0x20) { // DELAY
      if (buffer) { out.push(`STRING ${buffer}`); buffer=''; }
      const value = data[i++] | (data[i++] << 8);
      out.push(`DELAY ${value}`);
    } else if (op === 0x10) { // HOLD modifier
      if (buffer) { out.push(`STRING ${buffer}`); buffer=''; }
      const code = data[i++];
      heldModifiers.add(code);
      out.push(`HOLD ${name(code)}`);
    } else if (op === 0x11) { // RELEASE modifier
      if (buffer) { out.push(`STRING ${buffer}`); buffer=''; }
      const code = data[i++];
      heldModifiers.delete(code);
      out.push(`RELEASE ${name(code)}`);
    } else if (op === 0x12) { // KEY DOWN
      const code = data[i++];
      let char = keyByCode(code);

      // Map SHIFTed character
      if (heldModifiers.has(keyMap.SHIFT) && char && shiftMapInverse[char]) {
        char = shiftMapInverse[char];
      }

      if (char) buffer += char;
      else buffer += `[UNKNOWN 0x${code.toString(16)}]`;
    } else if (op === 0x13) { // KEY UP
      i++; // skip, handled in KEY DOWN
    } else {
      if (buffer) { out.push(`STRING ${buffer}`); buffer=''; }
      setStatus(`Unknown opcode 0x${op.toString(16)} at byte ${i-1}`);
    }
  }

  if (buffer) out.push(`STRING ${buffer}`);
  return out.join('\n');
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
