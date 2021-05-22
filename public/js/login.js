const myform = document.getElementById('myform');
let db = null;
function adddNote(cryptoPasswordKey) {
    const cryptoObj = {
        cryptoID: 1,
        cryptoObj: cryptoPasswordKey
    }
    if (db === null) { 
        alert("You have no database");
        return;
    }
    const tx = db.transaction("crypto_key", "readwrite");   //opened a transaction
    const crpto = tx.objectStore("crypto_key");
    crpto.add(cryptoObj);
    myform.submit();
  }
function createDB(cryptoPasswordKey) {
    const request = indexedDB.open("cryptoKey", 1);    //cerating a database
  
    //on upgrade needed
    request.onupgradeneeded = e => {
        db = e.target.result;
        db.createObjectStore("crypto_key", {keyPath: "cryptoID"});      //This is a table. keyPath is a primary key
        myform.submit();
    }
    
    request.onsuccess = e => {
        db = e.target.result;
        adddNote(cryptoPasswordKey);
    }
  
    request.onerror = e => {
        console.log(e.target.error);
    }
  }
  
  function getDataEncoding(data) {
    console.log('data :'+data);
    var encodedData=new Array();
    const enc = new TextEncoder();
    data.forEach(element => {
        encodedData.push(enc.encode(element));
    });
    return encodedData;
  }
  
  async function getCryptoKey(passwordInBytes) {
    return await crypto.subtle.importKey(
        "raw",
        passwordInBytes,
        "PBKDF2",
        false,
        // to derive key
        ["deriveKey"]
    );
  }

async function digestMessage(message) {
    const msgUint8 = new TextEncoder().encode(message);                           // encode as (utf-8) Uint8Array
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);           // hash the message
    const hashArray = Array.from(new Uint8Array(hashBuffer));                     // convert buffer to byte array
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join(''); // convert bytes to hex string
    return hashHex;
}
  
myform.onsubmit = async function() {
    const dbs = await window.indexedDB.databases();
    dbs.forEach(db => { window.indexedDB.deleteDatabase(db.name) });
    const password = document.getElementById('password').value;
    encodedData = getDataEncoding([password]);
    var passwordInBytes = encodedData[0];
    console.log(passwordInBytes);
    const cryptoPasswordKey = await getCryptoKey(passwordInBytes);
    const res = createDB(cryptoPasswordKey);
    const digestHexPassword = await digestMessage(password);
    document.getElementById('password').value = digestHexPassword;
    // myform.submit();
};