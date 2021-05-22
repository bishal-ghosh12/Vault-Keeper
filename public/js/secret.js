const myform = document.getElementById('myform');
let db = null;

function getDataEncoding(data) {
    console.log('data :'+data);
    var encodedData=new Array();
    const enc = new TextEncoder();
    data.forEach(element => {
        encodedData.push(enc.encode(element));
    });
    return encodedData;
}

async function getAesKey(passwordKey, salt) {
    return await crypto.subtle.deriveKey(
        {
            name:"PBKDF2",
            salt,
            iterations: 250000,
            hash: {name: 'SHA-256'}
        }, passwordKey, {name:'AES-GCM', length: 256}, false, ['encrypt', 'decrypt']
    );
}

function base64encode(binary) {
    return window.btoa(String.fromCharCode.apply(null, binary));
}   

// function base64encode( buffer ) {
//     var binary = '';
//     var bytes = new Uint8Array( buffer );
//     var len = bytes.byteLength;
//     for (var i = 0; i < len; i++) {
//         binary += String.fromCharCode( bytes[ i ] );
//     }
//     return window.btoa( binary );
// }

async function encrypt(data, salt, aeskey, iv) {
    return new Promise(
       async function(resolve, reject) {
        encodedData = getDataEncoding([data]);
        var dataInBytes = encodedData[0];
        console.log('love' +dataInBytes);
        console.log('Encoded Data: ' +encodedData.length);
        const encryptedContent = await crypto.subtle.encrypt({
            name: "AES-GCM",
            iv}, aeskey, dataInBytes
        );
        // console.log('encrypted Content ' +encryptedContent);
        // console.log('Salt Content ' +salt);
        // console.log('Iv Content ' +iv);
        console.log(encryptedContent);
        const encryptedBytes = new Uint8Array(encryptedContent);
        console.log(encryptedBytes); 
        // const ec = salt + iv + encryptedContent;
        // console.log(salt);
        // console.log(iv);
        // console.log(encryptedContent);
        // console.log(salt);
        console.log("Salt Encoded   " +base64encode(salt));
        console.log(base64encode(salt).length);
        // console.log("Salt uint8arrayEncoded   " +new Uint8Array(_base64ToArrayBuffer(base64encode(salt))));
        console.log("iv Encoded   " +base64encode(iv));
        console.log("Encrypted Bytes    " +base64encode(encryptedBytes));
        const totalres = base64encode(salt)+base64encode(iv)+base64encode(encryptedBytes);
        // console.log(totalres);
        resolve(totalres);
            }
        );
}

function _base64ToArrayBuffer(base64) {
    var binary_string = window.atob(base64);
    var len = binary_string.length;
    var bytes = new Uint8Array(len);
    for (var i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
}

function convertDataURIToBinary(dataURI) {
    var base64Index = dataURI.indexOf(BASE64_MARKER) + BASE64_MARKER.length;
    var base64 = dataURI.substring(base64Index);
    var raw = window.atob(base64);
    var rawLength = raw.length;
    var array = new Uint8Array(new ArrayBuffer(rawLength));
  
    for(i = 0; i < rawLength; i++) {
      array[i] = raw.charCodeAt(i);
    }
    return array;
  }

async function validateMyForm() {
    const res = await loadFromIndexedDB("cryptoKey", 1);
    const password = document.getElementById('password').value;
    const passwordKey = res[1];                        
    console.log('weak password crypto key :'+passwordKey);
    // derive an aes key from passwordKey
    const salt = crypto.getRandomValues(new Uint8Array(32));
    console.log('salt:' +salt);
    const aeskey = await getAesKey(passwordKey, salt);
    console.log('aes key :'+ aeskey);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    console.log('iv:' +iv);
    
    const title = document.getElementById('title').value; 
    const login = document.getElementById('login').value; 

    const passwordEncrypted = await encrypt(password, salt, aeskey, iv);
    const loginEncrypted = await encrypt(login, salt, aeskey, iv);
    console.log('LoginEncrypted : ' +loginEncrypted);
    console.log('PasswordEncrypted : ' +passwordEncrypted);
    document.getElementById('password').value = passwordEncrypted;
    document.getElementById('login').value = loginEncrypted;
    myform.submit();
    return false;
};

function loadFromIndexedDB(storeName){
    return new Promise(
      function(resolve, reject) {
        var dbRequest = indexedDB.open(storeName);
  
        dbRequest.onerror = function(event) {
          reject(Error("Error text"));
        };
  
        dbRequest.onupgradeneeded = function(event) {
          // Objectstore does not exist. Nothing to load
          event.target.transaction.abort();
          reject(Error('Not found'));
        };
  
        dbRequest.onsuccess = function(event) {
          var database      = event.target.result;
          var transaction   = database.transaction(["crypto_key"]);
          var objectStore   = transaction.objectStore("crypto_key");
          objectStore.openCursor().onsuccess = function(event) {
            let cursor = event.target.result;
            if (cursor) {
                resolve([cursor.value.cryptoID, cursor.value.cryptoObj]);
            }
          }
        };
      }
    );
  }