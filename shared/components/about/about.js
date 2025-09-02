let swiper = new Swiper(".myAboutSwiper", {
  loop: true,
  autoplay: {
    delay: 2500,
    disableOnInteraction: false,
  },
  slidesPerView: 3,
  spaceBetween: 20,
  breakpoints: {
    320: {
      // موبايل صغير
      slidesPerView: 1,
      spaceBetween: 10,
    },
    768: {
      // تابلت
      slidesPerView: 2,
      spaceBetween: 15,
    },
    1024: {
      // لابتوب
      slidesPerView: 3,
      spaceBetween: 20,
    },
    1280: {
      // شاشات أكبر
      slidesPerView: 3,
      spaceBetween: 20,
    },
  },
});

// وقف عند الهوفر
swiper.el.addEventListener("mouseenter", () => swiper.autoplay.stop());
swiper.el.addEventListener("mouseleave", () => swiper.autoplay.start());

// --------------------------------------------------------------------------
// // add cardes flasch-sales
fetch("about.json")
  .then((res) => res.json())
  .then((data) => {
    const container = document.getElementById("cardsAboutContainer");

    data.forEach((card) => {
      container.innerHTML += `
        <div class="swiper-slide text-center text-lg-start px-2 mt-3">
  <div>
     <img src=${card.img} class="img-fluid">
       
  <div class="card-body">
    <h3 class="pt-2">${card.name}</h3>
    <p class="fs-6">${card.job}</p>
    <div class="d-flex gap-3 justify-content-center justify-content-lg-start">
  <i class="${card.icons[0]} fs-5"></i>
  <i class="${card.icons[1]} fs-5"></i>
  <i class="${card.icons[2]} fs-5"></i>
</div>
  </div>
</div>
</div>
      `;
    });
  });
