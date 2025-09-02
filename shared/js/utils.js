window.addEventListener("scroll", function () {
  const navbar = document.querySelectorAll(".navbar-container");
  navbar.forEach((nav) => {
    if (window.scrollY > 112) {
      // 7rem = 112px
      nav.classList.add("fixed-top");
    } else {
      nav.classList.remove("fixed-top");
    }
  });
});
window.addEventListener("load", () => {
  updateWishlistCount();
  updateCartBadge();
});
let navbar = document.querySelectorAll(".navbar-container");
// Load navbar dynamically
fetch("/shared/components/navbar/navbar.html")
  .then((response) => response.text())
  .then((data) => {
    navbar.forEach((e) => {
      e.innerHTML = data;
      let userData = JSON.parse(localStorage.getItem("userData"));
      // let likedProducts = userData.likedProducts.length;
      // console.log(likedProducts);
      let userMenu = document.getElementById("userMenu");
      let loginBtn = document.getElementById("loginBtn");

      if (userData) {
        userMenu.classList.remove("d-none"); // يظهر القائمة بعد تسجيل الدخول
        loginBtn.classList.add("d-none"); // يظهر القائمة بعد تسجيل الدخول
      } else {
        userMenu.classList.add("d-none"); // يخفيها لو مفيش تسجيل دخول
        loginBtn.classList.remove("d-none"); // يخفيها لو مفيش تسجيل دخول
      }

      // ------------------------------------------------------------------
      //My Account
      document
        .getElementById("My-Account")
        .addEventListener("click", function (e) {
          e.preventDefault();
          let role = JSON.parse(localStorage.getItem("userData"));
          if (role.role === "admin" || role.role === "superadmin") {
            location.href = "/shared/components/errorPage/index.html";
          } else if (role.role === "seller") {
            location.href = "/shared/components/dashboard/dashboard.html";
          } else if (role.role === "customer") {
            localStorage.setItem("lastTab", "profile");
            window.location.assign("/customer/dashboard/dashboard.html");
          } else {
            location.href = "/shared/components/errorPage/index.html";
          }
        });
      document
        .getElementById("myOrders")
        .addEventListener("click", function (e) {
          e.preventDefault();
            localStorage.setItem("lastTab", "orders");
            window.location.assign("/customer/dashboard/dashboard.html");
        });
      // ------------------------------------------------------------------

      document.getElementById("Logout").addEventListener("click", function (e) {
        e.preventDefault(); // منع الانتقال للرابط

        Swal.fire({
          title: "Are you sure?",
          text: "You will be logged out from your account.",
          icon: "warning",
          showCancelButton: true,
          confirmButtonColor: "#3085d6",
          cancelButtonColor: "#d33",
          confirmButtonText: "Yes, logout!",
          cancelButtonText: "Cancel",
        }).then((result) => {
          if (result.isConfirmed) {

            const getUsers = JSON.parse(localStorage.getItem("users")) || {};
            const getLastData = JSON.parse(localStorage.getItem("userData"));



            if (getLastData.role === "customer") {
              if (getUsers.customers && getUsers.customers[getLastData.id]) {
                getUsers.customers[getLastData.id] = getLastData;

                localStorage.setItem("users", JSON.stringify(getUsers));

                console.log("Current customer updated in users:", getUsers.customers[getLastData.id]);
              } else {
                console.log("Customer not found in users list");
              }
            } else {
              console.log("Current user is not a customer");
            }

            // مسح بيانات المستخدم
            localStorage.removeItem("userData");

            // إشعار النجاح
            Swal.fire({
              title: "Logged out!",
              text: "You have been logged out successfully.",
              icon: "success",
              timer: 2000,
              showConfirmButton: false,
            }).then(() => {
              // إعادة التوجيه أو تحديث الصفحة
              location.href = "/login/login.html";
            });
          }
        });
      });
    });
  });

// Load sidebar dynamically
fetch("/shared/components/sidebar/sidebar.html")
  .then((response) => response.text())
  .then((data) => {
    document.getElementById("sidebar-container").innerHTML = data;
  });

// Load footer dynamically
let footer = document.querySelectorAll(".footer-container");
fetch("/shared/components/footer/footer.html")
  .then((res) => res.text())
  .then((data) => {
    footer.forEach((e) => {
      e.innerHTML = data;
    });
  });
// -----------------------------------------------------------------------
// cart counter
function updateCartBadge() {
  let cart=[];
  const userDataStr = localStorage.getItem("userData");
  const userData = userDataStr ? JSON.parse(userDataStr) : { cart: [] };
  !(userData.cart)?cart = []:cart = userData.cart;


  const cartIcon = document.querySelector("#navCartIcon");
  const cartCount = document.querySelector("#cartCount");

  if (cartIcon && cartCount) {
    const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);

    if (totalItems > 0) {
      cartCount.classList.remove("d-none");
      cartCount.textContent = totalItems;

      // Trigger bounce animation once
      if (!localStorage.getItem("cartUpdated")) {
        cartIcon.classList.add("fa-bounce");
        setTimeout(() => {
          cartIcon.classList.remove("fa-bounce");
        }, 1000);
        localStorage.setItem("cartUpdated", "true");
      }
    } else {
      cartCount.classList.add("d-none");
      cartCount.textContent = "";
      cartIcon.classList.remove("fa-bounce");
      localStorage.removeItem("cartUpdated");
    }
  }
}

function updateWishlistCount() {
  const wishCount = document.getElementById("wishCount");
  if (!wishCount) return;

  const userDataStr = localStorage.getItem("userData");
  const userData = userDataStr ? JSON.parse(userDataStr) : { likedProducts: [] };
  const liked = userData.likedProducts || [];

  wishCount.textContent = liked.length === 0 ? "" : liked.length;
}




    function   updateCartBadge(){
    let userData = JSON.parse(localStorage.getItem("userData"));
    let cart =userData.cart || [];
            

  const cartIcon = document.querySelector('#navCartIcon');
  if (cartIcon && cartCount) {
   const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);


    if (totalItems > 0) {
      cartCount.classList.remove('d-none');
      cartCount.textContent = totalItems === 0 ? '' : totalItems;
   
      localStorage.setItem('cartUpdated', true);

      // Add bounce only if not already added
     
if(!localStorage.getItem('cartUpdated')){
    cartIcon.classList.add('fa-bounce');
    setTimeout(() => {
      cartIcon.classList.remove('fa-bounce'); // remove after 1s
    }, 1000);
  }





      // Save a flag in localStorage so it persists
    } else {
      cartCount.classList.add('d-none');
      cartCount.textContent = '';
      cartIcon.classList.remove('fa-bounce');
      localStorage.removeItem('cartUpdated');
    }
  }
}


function cartClick() {
  const cartIcon = document.getElementById("navCartIcon");

  cartIcon.addEventListener("click", function () {
    cartIcon.classList.toggle("active");
  });
}
(function wishList() {
  document.addEventListener("click", (e) => {
    const heart = e.target.closest("#WishList");
    if (!heart) return; // ✅ only handle wishlist clicks

    const rawUser =
      localStorage.getItem("user") || localStorage.getItem("userData");
    const user = rawUser ? JSON.parse(rawUser) : null;

    if (!user) {
      Swal.fire({
        icon: "warning",
        title: "Please login first",
        text: "You must be logged in to view your wishList.",
        showCancelButton: true,
        confirmButtonText: "Login",
        cancelButtonText: "Cancel",
      }).then((result) => {
        if (result.isConfirmed) {
          window.location.href = "/login/login.html";
        }
        // Cancel → do nothing
      });
      return;
    }

    // ✅ Only logged-in users reach here
    e.preventDefault();
    localStorage.setItem("lastTab", "wishlist");
    window.location.assign("/customer/dashboard/dashboard.html");
  });
})();

// ===============================

function productClik() {
  const currentUserId = localStorage.getItem("userData");
  if (!currentUserId) return;
  location.href = "/customer/products/products.html";
}
(function initCartGate() {
  document.addEventListener("click", function (e) {
    // Match clicks on the anchor or the inner icon
    const trigger = e.target.closest("#cartIcon, #navCartIcon");
    if (!trigger) return;

    // Stop default navigation (even if <a href> is present)
    e.preventDefault();

    // Support both keys you used across the app: "user" and "userData"
    const rawUser = localStorage.getItem("user") || localStorage.getItem("userData");
    const user = rawUser ? JSON.parse(rawUser) : null;

    if (!user) {
      Swal.fire({
        icon: "warning",
        title: "Please login first",
        text: "You must be logged in to view your cart.",
        showCancelButton: true,
        confirmButtonText: "Login",
        cancelButtonText: "Cancel",
      }).then((result) => {
        if (result.isConfirmed) {
          // Go to login page
          window.location.href = "/login/login.html";
        }
        // If canceled, do nothing (stay on page)
      });
      return;
    }


    // Logged in → go to cart
    window.location.href = "/customer/cart/cart.html";
    // e.g. window.location.href = "/customer/cart/cart.html";
  });
})();
