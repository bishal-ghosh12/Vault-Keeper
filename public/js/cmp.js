function getAllSecrets() {
    return new Promise((resolve, reject) => {
        fetch('/pms/getAllSecrets', {
            method: "GET"
        })
        .then(res => res.json())
        .then(json => {
            resolve(json.data);
        })
        .catch(err => {
            console.log('Error problem');
        })
    })
}

function decrypt(data) {
    return new Promise(async(resolve, reject) => {
        const totalEncryptedLogin = data.login;
        const totalEncryptedPassword = data.password;

        const salt = totalEncryptedLogin.substr(0, 44);
        const iv = totalEncryptedLogin.substring(44, 44 + 16);
        const encryptedLogin = totalEncryptedLogin.substring(44 + 16);
        const encryptedPassword = totalEncryptedPassword.substring(44 + 16);

        const uint8salt = new Uint8Array(_base64ToArrayBuffer(salt));
        const uint8iv = new Uint8Array(_base64ToArrayBuffer(iv));
        const uint8login = new Uint8Array(_base64ToArrayBuffer(encryptedLogin));
        const uint8password = new Uint8Array(_base64ToArrayBuffer(encryptedPassword));

        const res = await loadFromIndexedDB("cryptoKey", 1);
        const aeskey = await getAesKey(res[1], uint8salt);

        const login = new TextDecoder("utf-8").decode(new Uint8Array(await decryptMessage(aeskey, uint8login, uint8iv)));
        const pass = new TextDecoder("utf-8").decode(new Uint8Array(await decryptMessage(aeskey, uint8password, uint8iv)));
        
        const decryptedData = data;
        decryptedData.login = login;
        decryptedData.password = pass;
        resolve(decryptedData);
    })
}

function decryptAllSecrets(datas) {
    return new Promise((resolve, reject) => {
        const decryptedData = [];
        datas.forEach(async(data) => {
            decryptedData.push(decrypt(data));
        });
        Promise.all(decryptedData)
            .then(res => resolve(res));
    });
}

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

async function encryptData(data) {
    const res = await loadFromIndexedDB("cryptoKey", 1);
    const password = data.password;
    const passwordKey = res[1];                        
    console.log('weak password crypto key :'+passwordKey);
    // derive an aes key from passwordKey
    const salt = crypto.getRandomValues(new Uint8Array(32));
    console.log('salt:' +salt);
    const aeskey = await getAesKey1(passwordKey, salt);
    console.log('aes key :'+ aeskey);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    console.log('iv:' +iv);
    
    const login = data.login; 

    const passwordEncrypted = await encrypt(password, salt, aeskey, iv);
    const loginEncrypted = await encrypt(login, salt, aeskey, iv);

    data.login = loginEncrypted;
    data.password = passwordEncrypted;

    return data;
}

function encryptAllSecrets(datas) {
    console.log('Hello');
    return new Promise((resolve, reject) => {
        const encryptedData = [];
        datas.forEach(async(data) => {
            encryptedData.push(encryptData(data));
        });
        Promise.all(encryptedData)
            .then(res => resolve(res));
    });
}

function storeNewDigestPassword(pass) {
    fetch('/pms/updateNewPassword', {
        method: "POST",
        body: JSON.stringify({
            password: pass
        }),
        headers: {
            "Content-type": "application/json; charset=UTF-8"
        }
    })
    .then(res => res.json())
    .then(data => {
        if (data.flag === true) return true;
        else return false;
    })
    .catch(err => console.log('Error in Password Updation'));
}
 
async function displayData() {
    const data = await getAllSecrets();

    const decryptedData = await decryptAllSecrets(data);

    const password = document.getElementById('changepass').value;

    await deleteCryptoKey(1);
    
    encodedData = getDataEncoding([password]);
    const passwordInBytes = encodedData[0];
    
    const cryptoPasswordKey = await getCryptoKey(passwordInBytes);

    const dbres = await createDB(cryptoPasswordKey);

    const digestHexPassword = await digestMessage(password);

    const encryptedDatas = await encryptAllSecrets(decryptedData);

    storeAllDataIntoDatabase(encryptedDatas, digestHexPassword);
};

function storeAllDataIntoDatabase(encryptedDatas, digestPassword) {
    fetch('/pms/storeEncryptedData', {
        method: "POST",
        body: JSON.stringify({
            password: digestPassword,
            data: encryptedDatas
        }),
        headers: {
            "Content-type": "application/json; charset=UTF-8"
        }
    })
    .then(res => res.json())
    .then(data => {
        console.log(data);
        document.getElementById('cmpModal').style.display = "none";
        document.getElementById('successAlert').style.display = 'block';
        setTimeout(function () {
            document.getElementById('successAlert').style.display = 'none';
        }, 2000);
    })
    .catch(err => console.log('Error in Password Updation'));
}

const changeButton = document.getElementById('changebutton');
changeButton.addEventListener('click', (e) => {
    e.preventDefault();
    displayData();
})

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
    // myform.submit();
}

function deleteCryptoKey(key) {
    // console.log('Hello');
    return new Promise((resolve, reject) => {
        // console.log('Hello IndexDB');
        const request = indexedDB.open("cryptoKey", 1);    //cerating a database
    
        //on upgrade needed
        request.onupgradeneeded = e => {
            db = e.target.result;
            db.createObjectStore("crypto_key", {keyPath: "cryptoID"});      //This is a table. keyPath is a primary key
            // myform.submit();
        }
        
        request.onsuccess = e => {
            db = e.target.result;
            // resolve(adddNote(cryptoPasswordKey));
            var transaction = db.transaction("crypto_key", "readwrite").objectStore("crypto_key");
            // var transaction = db.transaction([store]).objectStore(store);
            // const req = transaction.get(1);
            const req = transaction.delete(key);
            req.onsuccess = (event) => {
                resolve(`key deleted from db`);
            }
            req.onerror = (event) => {
                reject(event.target.error);
            }
                // resolve(1);
            }
    
        request.onerror = e => {
            reject(e.target.error);
        }
    });
}

function createDB(cryptoPasswordKey) {
    return new Promise((resolve, reject) => {
        // console.log('Hello IndexDB');
        const request = indexedDB.open("cryptoKey", 1);    //cerating a database
    
        //on upgrade needed
        request.onupgradeneeded = e => {
            db = e.target.result;
            db.createObjectStore("crypto_key", {keyPath: "cryptoID"});      //This is a table. keyPath is a primary key
            // myform.submit();
        }
        
        request.onsuccess = e => {
            db = e.target.result;
            // resolve(adddNote(cryptoPasswordKey));
            
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
            resolve(1);
        }
    
        request.onerror = e => {
            reject(e.target.error);
        }
    });
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

function getDataEncoding(data) {
    console.log('data :'+data);
    var encodedData=new Array();
    const enc = new TextEncoder();
    data.forEach(element => {
        encodedData.push(enc.encode(element));
    });
    return encodedData;
  }

async function digestMessage(message) {
    const msgUint8 = new TextEncoder().encode(message);                           // encode as (utf-8) Uint8Array
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);           // hash the message
    const hashArray = Array.from(new Uint8Array(hashBuffer));                     // convert buffer to byte array
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join(''); // convert bytes to hex string
    return hashHex;
}

async function decryptMessage(key, data, IV) {
    return await window.crypto.subtle.decrypt({
        name: "AES-GCM",
        iv: IV,
    },
        key,
        data
    )
        .then((decrypted) => {
            return decrypted;
        })
        .catch(function (err) {
            console.log('hello');
            console.error(err);
        });
}

function _base64ToArrayBuffer(base) {
    var binary_string = window.atob(base);
    var len = binary_string.length;
    var bytes = new Uint8Array(len);
    for (var i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
}

function loadFromIndexedDB(storeName) {
    return new Promise(
        function (resolve, reject) {
            var dbRequest = indexedDB.open(storeName);

            dbRequest.onerror = function (event) {
                reject(Error("Error text"));
            };

            dbRequest.onupgradeneeded = function (event) {
                event.target.transaction.abort();
                reject(Error('Not found'));
            };

            dbRequest.onsuccess = function (event) {
                var database = event.target.result;
                var transaction = database.transaction(["crypto_key"]);
                var objectStore = transaction.objectStore("crypto_key");
                objectStore.openCursor().onsuccess = function (event) {
                    let cursor = event.target.result;
                    if (cursor) {
                        resolve([cursor.value.cryptoID, cursor.value.cryptoObj]);
                    }
                }
            };
        }
    );
}

async function getAesKey(passwordKey, salt) {
    return await crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt,
            iterations: 250000,
            hash: { name: 'SHA-256' }
        }, passwordKey, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']
    );
}

async function getAesKey1(passwordKey, salt) {
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