"use strict";

const ulElAcc = document.getElementById("ul-el-accepted")
const ulElNot = document.getElementById("ul-el-not")
const ulElClear = document.getElementById("ul-el-clear")
const quests = loadJSON('quests.json')
const ordering = loadJSON('ordering.json')

function handleFileSelect(evt) {
  var files = evt.target.files; // FileList object
  var reader = new FileReader();
  reader.readAsArrayBuffer(files[0]);
  reader.onload = function() {
    loadData(reader.result)
  }
}
document.getElementById('files').addEventListener('change', handleFileSelect, false);

function loadJSON(filename) {
  var output = {}
  fetch(filename)
    .then(function(resp) {
      return resp.json()
    })
    .then(function(data) {
      for (const[key,value] of Object.entries(data)) {
	output[key] = value
      }
    })
  return output
}

function readInteger(array) {
  let x = 0
  for (let i=0; i < array.length; i++) {
    x += array[i] << (8 * i)
  }
  return x
}

function readString(array) {
  let x = ""
  for (let i=0; i < array.length; i++) {
    x += String.fromCharCode(array[i]);
  }
  return x
}

function removeAllChildren(parent) {
  while (parent.firstChild) {
    parent.removeChild(parent.firstChild)
  }
}

function filterQuests(data, parent, string) {
  removeAllChildren(parent)
  for (let i=0; i<101; i++) {
    let key = ordering[i]
    let value = data[key]
    if (value == string) {
      if (key in quests) {
	const li = document.createElement("p");
	li.textContent = quests[key].index + ":  " + quests[key].name
	parent.append(li)
      }
    }
  }
}

function loadData(buffer) {
  var compressed = buffer.slice(0xc, buffer.byteLength)
  var decompressed = pako.inflate(compressed);

  var x = "QuestStateList"
  var result = new Uint8Array(x.length);
  for (let i=0; i < x.length; i++) {
    result[i] = x.charCodeAt(i)
  }

  // Get index of QuestStateList
  var index = 0;
  for (let i=0; i < decompressed.length; i++) {
    let j = 0;
    while (decompressed[i] == result[j]) {
      i += 1
      j += 1
    }
    if (j == x.length) {
      index = i;
    }
  }
  index += 0x40;
  let count = readInteger(decompressed.slice(index,index+4))
  index += 4
  var data = {} 
  while (count > 0) {
    let x1 = readInteger(decompressed.slice(index, index+4))
    let y1 = readString(decompressed.slice(index+4, index+4+x1-1))
    index += x1 + 4
    let x2 = readInteger(decompressed.slice(index, index+4))
    let y2 = readString(decompressed.slice(index+4, index+4+x2-1))
    let z = y2.split('::')[1]
    index += x2 + 4
    count -= 1
    data[y1] = z
  }

  filterQuests(data, ulElAcc, 'AlreadyPlayedAcceptEvent')
  filterQuests(data, ulElNot, 'NotYetAccept')
  filterQuests(data, ulElClear, 'Clear')

}
