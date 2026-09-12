/**
* Template Name: Knight
* Template URL: https://bootstrapmade.com/knight-free-bootstrap-theme/
* Updated: Oct 16 2024 with Bootstrap v5.3.3
* Author: BootstrapMade.com
* License: https://bootstrapmade.com/license/
*/

(function() {
  "use strict";

  /**
   * Apply .scrolled class to the body as the page is scrolled down
   */
  function toggleScrolled() {
    const selectBody = document.querySelector('body');
    const selectHeader = document.querySelector('#header');
    if (!selectHeader.classList.contains('scroll-up-sticky') && !selectHeader.classList.contains('sticky-top') && !selectHeader.classList.contains('fixed-top')) return;
    window.scrollY > 100 ? selectBody.classList.add('scrolled') : selectBody.classList.remove('scrolled');
  }

  document.addEventListener('scroll', toggleScrolled);
  window.addEventListener('load', toggleScrolled);

  /**
   * Mobile nav toggle
   */
  const mobileNavToggleBtn = document.querySelector('.mobile-nav-toggle');

  function mobileNavToogle() {
    document.querySelector('body').classList.toggle('mobile-nav-active');
    mobileNavToggleBtn.classList.toggle('bi-list');
    mobileNavToggleBtn.classList.toggle('bi-x');
  }
  if (mobileNavToggleBtn) {
    mobileNavToggleBtn.addEventListener('click', mobileNavToogle);
  }

  /**
   * Hide mobile nav on same-page/hash links
   */
  document.querySelectorAll('#navmenu a').forEach(navmenu => {
    navmenu.addEventListener('click', () => {
      if (document.querySelector('.mobile-nav-active')) {
        mobileNavToogle();
      }
    });

  });

  /**
   * Toggle mobile nav dropdowns
   */
  document.querySelectorAll('.navmenu .toggle-dropdown').forEach(navmenu => {
    navmenu.addEventListener('click', function(e) {
      e.preventDefault();
      this.parentNode.classList.toggle('active');
      this.parentNode.nextElementSibling.classList.toggle('dropdown-active');
      e.stopImmediatePropagation();
    });
  });

  /**
   * Preloader
   */
  const preloader = document.querySelector('#preloader');
  if (preloader) {
    window.addEventListener('load', () => {
      preloader.remove();
    });
  }

  /**
   * Scroll top button
   */
  let scrollTop = document.querySelector('.scroll-top');

  function toggleScrollTop() {
    if (scrollTop) {
      window.scrollY > 100 ? scrollTop.classList.add('active') : scrollTop.classList.remove('active');
    }
  }
  scrollTop.addEventListener('click', (e) => {
    e.preventDefault();
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });

  window.addEventListener('load', toggleScrollTop);
  document.addEventListener('scroll', toggleScrollTop);

  /**
   * Animation on scroll function and init
   */
  function aosInit() {
    AOS.init({
      duration: 600,
      easing: 'ease-in-out',
      once: true,
      mirror: false
    });
  }
  window.addEventListener('load', aosInit);

  /**
   * Init swiper sliders
   */
  function initSwiper() {
    document.querySelectorAll(".init-swiper").forEach(function(swiperElement) {
      let config = JSON.parse(
        swiperElement.querySelector(".swiper-config").innerHTML.trim()
      );

      if (swiperElement.classList.contains("swiper-tab")) {
        initSwiperWithCustomPagination(swiperElement, config);
      } else {
        new Swiper(swiperElement, config);
      }
    });
  }

  window.addEventListener("load", initSwiper);

  /**
   * Paginate the blog listing without changing the generated post URLs.
   */
  function initBlogPagination() {
    const paginationSection = document.querySelector('[data-blog-pagination]');
    if (!paginationSection) return;

    const cards = Array.from(paginationSection.querySelectorAll('.blog-post-card'));
    const controls = document.querySelector('[data-blog-pagination-controls]');
    const status = document.querySelector('[data-blog-pagination-status]');
    const paginationControlsSection = document.querySelector('#blog-pagination');
    const categoryButtons = Array.from(document.querySelectorAll('[data-blog-category]'));
    const pageSize = Number(paginationSection.dataset.pageSize) || 6;
    const hashPage = Number(window.location.hash.replace('#blog-page-', ''));
    let currentPage = Number.isInteger(hashPage) && hashPage > 0 ? hashPage : 1;
    let activeCategory = 'all';

    function getFilteredCards() {
      return activeCategory === 'all'
        ? cards
        : cards.filter((card) => card.dataset.blogCategoryValue === activeCategory);
    }

    function makeControl(label, page, icon, isActive = false) {
      const item = document.createElement('li');
      const link = document.createElement('a');
      link.href = `#blog-page-${page}`;
      link.setAttribute('aria-label', label);

      if (icon) {
        link.innerHTML = `<i class="bi ${icon}" aria-hidden="true"></i>`;
      } else {
        link.textContent = page;
      }

      if (isActive) {
        link.classList.add('active');
        link.setAttribute('aria-current', 'page');
      }

      link.addEventListener('click', (event) => {
        event.preventDefault();
        currentPage = page;
        render();
        history.replaceState(null, '', link.href);
      });

      item.appendChild(link);
      return item;
    }

    function render() {
      const filteredCards = getFilteredCards();
      const pageCount = Math.max(1, Math.ceil(filteredCards.length / pageSize));
      currentPage = Math.min(currentPage, pageCount);
      const firstCard = (currentPage - 1) * pageSize;
      const lastCard = Math.min(firstCard + pageSize, filteredCards.length);

      cards.forEach((card) => {
        card.hidden = !filteredCards.slice(firstCard, lastCard).includes(card);
      });

      controls.replaceChildren();
      if (currentPage > 1) {
        controls.appendChild(makeControl('Previous blog page', currentPage - 1, 'bi-chevron-left'));
      }

      for (let page = 1; page <= pageCount; page += 1) {
        controls.appendChild(makeControl(`Blog page ${page}`, page, null, page === currentPage));
      }

      if (currentPage < pageCount) {
        controls.appendChild(makeControl('Next blog page', currentPage + 1, 'bi-chevron-right'));
      }

      status.textContent = `Showing ${filteredCards.length ? firstCard + 1 : 0}-${lastCard} of ${filteredCards.length} blog posts`;
      paginationControlsSection.hidden = pageCount === 1;
    }

    categoryButtons.forEach((button) => {
      button.addEventListener('click', () => {
        activeCategory = button.dataset.blogCategory;
        currentPage = 1;
        categoryButtons.forEach((categoryButton) => {
          categoryButton.classList.toggle('active', categoryButton === button);
        });
        render();
      });
    });

    render();
  }

  initBlogPagination();

  /**
   * Initiate glightbox
   */
  const glightbox = GLightbox({
    selector: '.glightbox'
  });

  /**
   * Init isotope layout and filters
   */
  document.querySelectorAll('.isotope-layout').forEach(function(isotopeItem) {
    let layout = isotopeItem.getAttribute('data-layout') ?? 'masonry';
    let filter = isotopeItem.getAttribute('data-default-filter') ?? '*';
    let sort = isotopeItem.getAttribute('data-sort') ?? 'original-order';

    let initIsotope;
    imagesLoaded(isotopeItem.querySelector('.isotope-container'), function() {
      initIsotope = new Isotope(isotopeItem.querySelector('.isotope-container'), {
        itemSelector: '.isotope-item',
        layoutMode: layout,
        filter: filter,
        sortBy: sort
      });
    });

    isotopeItem.querySelectorAll('.isotope-filters li').forEach(function(filters) {
      filters.addEventListener('click', function() {
        isotopeItem.querySelector('.isotope-filters .filter-active').classList.remove('filter-active');
        this.classList.add('filter-active');
        initIsotope.arrange({
          filter: this.getAttribute('data-filter')
        });
        if (typeof aosInit === 'function') {
          aosInit();
        }
      }, false);
    });

  });

  /**
   * Frequently Asked Questions Toggle
   */
  document.querySelectorAll('.faq-item h3, .faq-item .faq-toggle').forEach((faqItem) => {
    faqItem.addEventListener('click', () => {
      faqItem.parentNode.classList.toggle('faq-active');
    });
  });

  /**
   * Correct scrolling position upon page load for URLs containing hash links.
   */
  window.addEventListener('load', function(e) {
    if (window.location.hash) {
      if (document.querySelector(window.location.hash)) {
        setTimeout(() => {
          let section = document.querySelector(window.location.hash);
          let scrollMarginTop = getComputedStyle(section).scrollMarginTop;
          window.scrollTo({
            top: section.offsetTop - parseInt(scrollMarginTop),
            behavior: 'smooth'
          });
        }, 100);
      }
    }
  });

  /**
   * Navmenu Scrollspy
   */
  let navmenulinks = document.querySelectorAll('.navmenu a');

  function navmenuScrollspy() {
    navmenulinks.forEach(navmenulink => {
      if (!navmenulink.hash) return;
      let section = document.querySelector(navmenulink.hash);
      if (!section) return;
      let position = window.scrollY + 200;
      if (position >= section.offsetTop && position <= (section.offsetTop + section.offsetHeight)) {
        document.querySelectorAll('.navmenu a.active').forEach(link => link.classList.remove('active'));
        navmenulink.classList.add('active');
      } else {
        navmenulink.classList.remove('active');
      }
    })
  }
  window.addEventListener('load', navmenuScrollspy);
  document.addEventListener('scroll', navmenuScrollspy);

})();