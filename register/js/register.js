// --------------------- عناصر الإدخال ---------------------
let userNameInput = document.getElementById("register-name");
let emailInput = document.getElementById("register-email");
let passwordInput = document.getElementById("register-password");
let RepassInput = document.getElementById("register-confirm");
let ErrorMsg = document.getElementById("ErrorMsg");
let role = document.querySelector("#role");

// --------------------- كائن الحالة ---------------------
let formState = {
  name: false,
  email: false,
  password: false,
  confirmPass: false,
  role: false,
};

// --------------------- عرض/إخفاء الحقول حسب الدور ---------------------
role.addEventListener("change", () => {
  const value = role.value;

  if (value) {
    role.classList.add("is-valid");
    role.classList.remove("is-invalid");
    formState.role = true;
  } else {
    role.classList.remove("is-valid");
    role.classList.add("is-invalid");
    formState.role = false;
  }
});

// --------------------- Regular Expressions ---------------------
let nameReg = /^[a-zA-Z\s]{3,20}$/;
let emailReg = /^[a-zA-Z][a-zA-Z0-9._%+-]+@[a-zA-Z]+\.[a-zA-Z]{2,}$/;
let PassReg = /^[a-zA-Z0-9]{5,10}$/;
let addressReg = /^[a-zA-Z0-9_\s]{5,}$/;

// --------------------- دالة التحقق ---------------------
function validation(input, Reg, key) {
  input.addEventListener("change", () => {
    let value = input.value.trim();
    if (Reg.test(value)) {
      input.classList.add("is-valid");
      input.classList.remove("is-invalid");
      formState[key] = true;
    } else {
      input.classList.remove("is-valid");
      input.classList.add("is-invalid");
      formState[key] = false;
    }
  });
}

// --------------------- ربط الحقول مع التحقق ---------------------
validation(userNameInput, nameReg, "name");
validation(emailInput, emailReg, "email");
validation(passwordInput, PassReg, "password");

// --------------------- تأكيد كلمة المرور ---------------------
RepassInput.addEventListener("change", () => {
  let confirmValue = RepassInput.value.trim();
  let passValue = passwordInput.value.trim();
  if (confirmValue === passValue && confirmValue !== "") {
    RepassInput.classList.add("is-valid");
    RepassInput.classList.remove("is-invalid");
    formState.confirmPass = true;
  } else {
    RepassInput.classList.remove("is-valid");
    RepassInput.classList.add("is-invalid");
    formState.confirmPass = false;
  }
});

let users = JSON.parse(localStorage.getItem("users")) || {
  customers: {},
  sellers: {},
};

// --------------------- التعامل مع الفورم ---------------------
document.getElementById("registerForm").addEventListener("submit", (e) => {
  e.preventDefault();

  const email = emailInput.value.trim();
  const userRole = role.value;
  const userName = userNameInput.value.trim();
  const password = passwordInput.value.trim();
  const id = Date.now().toString(); // مفتاح فريد كـ string

  // التحقق من صحة البيانات
  let isValid =
    formState.name &&
    formState.email &&
    formState.password &&
    formState.confirmPass &&
    formState.role;

  if (!isValid) {
    ErrorMsg.classList.remove("d-none");
    return;
  } else {
    ErrorMsg.classList.add("d-none");
  }

  // ✅ التحقق من وجود الإيميل سواء كان customer أو seller
  let exist =
    Object.values(users.customers).find((user) => user.email === email) ||
    Object.values(users.sellers).find((user) => user.email === email);

  if (exist) {
    document.getElementById("emailEx").classList.remove("d-none");
    return;
  }

  // --------------------- جلب tabs.json وإنشاء المستخدم ---------------------
  fetch("/tabs.json")
    .then((res) => res.json())
    .then((tabs) => {
      let newUser;

      if (userRole === "seller") {
        newUser = {
          id,
          name: userName,
          email,
          password,
          role: userRole,
          tabs: tabs[userRole],
        };
      } else {  // ! Edit By Abdallah Elsaied ( else if => else )
        newUser = {
          id,
          name: userName,
          email,
          password,
          role: userRole,
          status: "active"
          // ! Edit By Abdallah Elsaied ( Remove Line ) & Edit tabs json file
        };
      }

      // ✅ الإضافة بشكل صحيح داخل الـ object
      users[`${userRole}s`][id] = newUser;

      // حفظ البيانات في localStorage
      localStorage.setItem("users", JSON.stringify(users));
      localStorage.setItem("userData", JSON.stringify(newUser));

      // --------------------- الرسائل والتنقل ---------------------
      let currentUser = JSON.parse(localStorage.getItem("userData"));
      if (currentUser.role === "seller") {
        Swal.fire({
          title: "Sign Up!!",
          text: "You have been Sign Up! successfully.",
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
        }).then(() => {
          location.href = "/shared/components/dashboard/dashboard.html";
        });
      } else if (currentUser.role === "customer") {
        Swal.fire({
          title: "Sign Up!",
          text: "You have been Sign Up! successfully.",
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
        }).then(() => {
          location.href = "/index.html";
        });
      } else {
        Swal.fire({
          title: "can't signUp",
          text: "There was a problem during sign up.",
          icon: "error",
          timer: 2000,
          showConfirmButton: false,
        }).then(() => {
          location.href = "/shared/components/errorPage/index.html";
        });
      }

      // ✅ تصفير الفورم
      registerForm.reset();
    })
    .catch((err) => console.error("Failed to load tabs.json:", err));
});
