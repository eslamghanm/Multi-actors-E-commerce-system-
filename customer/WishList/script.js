const products = JSON.parse(localStorage.getItem("products")) || [];
const userDataId = localStorage.getItem("userData");
let getData = JSON.parse(localStorage.getItem("users")) || [];

const users = [];
Object.values(getData).forEach((group) => {
  Object.values(group).forEach((user) => {
    users.push(user);
  });
});
let userData = users.find((e) => e.id === JSON.parse(userDataId).id);
console.log(userData.wichList);
let allOrdersIds = userData.wichList.map((orderId) => +orderId);
let myOrders = products.filter((order) => allOrdersIds.includes(order.id));
const container = document.getElementById("wichList");
myOrders.length != 0
  ? (container.innerHTML = "")
  : (container.innerHTML = `<div class="w-100 mx-auto mt-4 text-center">
          <h4 class="my-2 ">You haven't uploaded any listing yet</h4>
          <img class="w-50" src="/assets/images/error/1.jpg" alt="">
          </div>`);
myOrders.forEach((card, index) => {
  container.innerHTML += `
        <div class="col-md-6 col-lg-3 my-2 text-center">
                
                  <div class="card position-relative" data-id="${card.id}">
                    <div class="position-relative overflow-hidden cartBtn">
                        <img src=${card.img} class="card-img-top img-fluid" alt="airbod1">
                        <div class="text-light bg-success text-center py-3 fw-bold fs-6 position-absolute top-100 w-100">Add To Cart</div>
                      </div>
                  <div class="card-body">
                    <h5 class="card-title">${card.productName}</h5>
                    <p class="price"><span class="text-danger fw-bold">$120</span> <span class="text-decoration-line-through ps-2 fw-bold oldPrice">$160</span></p>
                  </div>
                  <i style="cursor: pointer;" onclick="deleteProduct(${index})" class="fas fa-trash-alt position-absolute top-0 end-0 me-3 mt-2 fs-5 text-danger p-2 rounded-circle"></i>
                  <p class="px-2 py-1  bg-danger text-light position-absolute top-0 start-0 ms-3 mt-3 rounded-2" style="font-size: .8rem;">-40%</p>
                </div>
                </div>
        `;
});

function deleteProduct(index) {
  // Remove the item at the given index
  Swal.fire({
    title: "Are you sure?",
    text: "You Will Delete This Element.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "Yes, logout!",
    cancelButtonText: "Cancel",
  }).then((result) => {
    if (result.isConfirmed) {
      // مسح بيانات المستخدم
      userData.wichList.splice(index, 1);

      if (userData !== -1) {
        users[userData] = userData;
      }

      // Save updated users back to localStorage
      localStorage.setItem("users", JSON.stringify(users));

      // Optional: Refresh the page or re-render the list
      location.href = "/customer/WishList/index.html"; // simplest way to re-render

      // إشعار النجاح
      Swal.fire({
        title: "Deleted!",
        text: "You have been Deleted successfully.",
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
      }).then(() => {
        // إعادة التوجيه أو تحديث الصفحة
        location.reload();
      });
    }
  });
}
