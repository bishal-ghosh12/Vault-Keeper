const twofa = document.getElementById('is2fa');
const mymodal = document.getElementById('myModal');
const check = document.getElementById('check');
const span = document.getElementsByClassName("close")[0];
const span1 = document.getElementsByClassName("close1")[0];
const closeModal = document.getElementById('closemodal');
const closecmpmodal = document.getElementById('closecmpmodal');
mymodal.style.display = "none";
if (check.checked) {
    document.getElementById("timer").style.display = "block";
}
else {
    document.getElementById("timer").style.display = "none";
}
document.getElementById('successAlert').style.display = 'none';
const close = document.getElementsByClassName("closebtn");
close[0].onclick = function () {
    var div = this.parentElement;
    div.style.opacity = "0";
    setTimeout(function () { div.style.display = "none"; }, 600);
}

const myform = document.getElementById('myForm');
function checkRoll() {
    if (check.checked) {
        document.getElementById("timer").style.display = "block";
        fetch('/pms/autoLogout', {
            method: "POST",
            body: JSON.stringify({
                time: document.getElementById('timerValue').value
            }),
            headers: {
                "Content-type": "application/json; charset=UTF-8"
            }
        })
            .then(res => res.json())
            .then(json => {
                console.log(json);
                console.log('Auto LOGOUT ON');
            })
            .catch(err => {
                console.log('Error problem');
            })
    }
    else {
        console.log(check.checked);
        document.getElementById("timer").style.display = "none";
        fetch('/pms/autoLogoutOFF')
            .then(res => res.json())
            .then(json => {
                console.log(json);
                console.log('Auto Logout OFF');
            })
            .catch(err => {
                console.log('Error problem');
            })
    }
}

myform.addEventListener('submit', (e) => {
    e.preventDefault();
    // const formData = new FormData(this);
    fetch('/pms/autoLogout', {
        method: "POST",
        body: JSON.stringify({
            time: document.getElementById('timerValue').value
        }),
        headers: {
            "Content-type": "application/json; charset=UTF-8"
        }
    })
        .then(res => res.json())
        .then(json => {
            console.log(json);
            document.getElementById('successAlert').style.display = 'block';
            setTimeout(function () {
                document.getElementById('successAlert').style.display = 'none';
            }, 2000);
        })
        .catch(err => {
            console.log('Error problem');
        })
})

const form2fa = document.getElementById('form2fa');
let secretKey;
form2fa.addEventListener('submit', (e) => {
    e.preventDefault();
    // console.log(secretKey);
    fetch('/pms/activate2fa', {
        method: "POST",
        body: JSON.stringify({
            token: document.getElementById('token').value,
            secretKey
        }),
        headers: {
            "Content-type": "application/json; charset=UTF-8"
        }
    })
    .then(res => res.json())
    .then(data => {
        console.log(data.flag);
        
        if (data.flag === false) {
            document.getElementById('wrong_token').style.display = "block";
        }
        else {
            secretKey = "";
            mymodal.style.display = "none";
        }
    })
    .catch(err => console.log('2FA Authentication Failed!!'))
})

twofa.onclick = function() {
    console.log(twofa.checked);
    if (twofa.checked) {
        fetch('/pms/2fagenerate', {
            method: "GET"
        })
        .then(res => res.json())
        .then(json => {
            console.log(json);
            secretKey = json.secretKey;
            document.getElementById('qrcode').src = json.QRCode;
            if (twofa.checked) mymodal.style.display = "block";
        })
            .catch(err => {
                console.log('Error problem');
            })
    }
    else {
        fetch('/pms/off2fagenerate', {
            method: "GET"
        })
        .then(res => res.json())
        .then(json => {
            console.log(json);
        })
        .catch(err => {
            console.log('Error problem');
        })
    }
}

span.onclick = function() {
    mymodal.style.display = "none";
    twofa.checked = false;
    document.getElementById('wrong_token').style.display = "none";
  }

  span1.onclick = function() {
    cmpModal.style.display = "none";
  }
const cmp = document.getElementById('cmp');
cmp.addEventListener('click', (e) => {
    document.getElementById('cmpModal').style.display = 'block';
})