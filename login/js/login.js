let email = document.getElementById("loginEmail");
let password = document.getElementById("loginPassword");
let getData = JSON.parse(localStorage.getItem("users")) || [];

const users = [];
Object.values(getData).forEach((group) => {
  Object.values(group).forEach((user) => {
    users.push(user);
  });
});

document.getElementById("loginForm").addEventListener("submit", (e) => {
  e.preventDefault();

  const enteredEmail = email.value.trim();
  const enteredPassword = password.value.trim();

  let foundUser = users.find(
    (user) => user.email === enteredEmail && user.password === enteredPassword
  );

  if (foundUser) {
    // تخزين المستخدم في localStorage
    localStorage.setItem("userData", JSON.stringify(foundUser));
    document.getElementById("ErrorMsg").classList.add("d-none");
    let role = JSON.parse(localStorage.getItem("userData"));
    if (role.role === "superadmin" || role.role === "admin") {
      location.href = "/shared/components/dashboard/dashboard.html";
      loginForm.reset();
    } else if (role.role === "seller") {
      location.href = "/shared/components/dashboard/dashboard.html";
      loginForm.reset();
    } else if (role.role === "customer") {
      location.href = "/index.html";
      registerForm.reset();
    } else {
      location.href = "/shared/components/errorPage/index.html";
      registerForm.reset();
    }
  } else {
    document.getElementById("ErrorMsg").classList.remove("d-none");
  }
});
