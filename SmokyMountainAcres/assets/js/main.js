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
  if (typeof GLightbox === 'function') {
    GLightbox({
      selector: '.glightbox'
    });
  }

  /**
   * Init isotope layout and filters
   */
  document.querySelectorAll('.isotope-layout').forEach(function(isotopeItem) {
    let layout = isotopeItem.getAttribute('data-layout') ?? 'masonry';
    let filter = isotopeItem.getAttribute('data-default-filter') ?? '*';
    let sort = isotopeItem.getAttribute('data-sort') ?? 'original-order';

    let initIsotope;
    const isotopeContainer = isotopeItem.querySelector('.isotope-container');
    imagesLoaded(isotopeContainer, function() {
      initIsotope = new Isotope(isotopeContainer, {
        itemSelector: '.isotope-item',
        layoutMode: layout,
        filter: filter,
        sortBy: sort
      });
      isotopeContainer.isotopeInstance = initIsotope;
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
   * Load additional gallery photos as visitors approach the end of the list.
   */
  function initGalleryInfiniteScroll() {
    const gallery = document.querySelector('[data-gallery-infinite-scroll]');
    if (!gallery) return;

    const container = gallery.querySelector('.isotope-container');
    const sentinel = gallery.querySelector('[data-gallery-sentinel]');
    const status = gallery.querySelector('[data-gallery-status]');
    const loadingText = gallery.querySelector('[data-gallery-loading]');
    const feedUrl = gallery.dataset.galleryFeed;
    const batchSize = Number(gallery.dataset.galleryBatchSize) || 16;
    let photos = null;
    let nextIndex = container.querySelectorAll('.isotope-item').length;
    let isLoading = false;
    let autoLoadPaused = false;

    function createGalleryItem(photo) {
      const item = document.createElement('div');
      item.className = `col-lg-4 col-md-6 portfolio-item isotope-item filter-${photo.category}`;

      const image = document.createElement('img');
      image.src = photo.image;
      image.className = 'img-fluid';
      image.alt = photo.alt || photo.title || 'Farm gallery photo';
      image.loading = 'eager';
      item.appendChild(image);

      const info = document.createElement('div');
      info.className = 'portfolio-info';

      const title = document.createElement('h4');
      title.textContent = photo.title || '';
      info.appendChild(title);

      const description = document.createElement('p');
      description.textContent = photo.description || '';
      info.appendChild(description);

      const preview = document.createElement('a');
      preview.href = photo.image;
      preview.title = photo.title || photo.alt || 'Farm gallery photo';
      preview.dataset.gallery = `portfolio-gallery-${photo.category}`;
      preview.className = 'glightbox preview-link';

      const icon = document.createElement('i');
      icon.className = 'bi bi-zoom-in';
      icon.setAttribute('aria-hidden', 'true');
      preview.appendChild(icon);
      info.appendChild(preview);
      item.appendChild(info);

      return item;
    }

    let feedPromise = null;
    function loadFeed() {
      if (photos) return Promise.resolve();
      if (!feedPromise) {
        const start = performance.now();
        feedPromise = fetch(feedUrl, { headers: { Accept: 'text/html' } })
          .then((response) => {
            if (!response.ok) throw new Error(`Gallery request failed: ${response.status}`);
            return response.text();
          })
          .then((markup) => {
            const dataElement = new DOMParser().parseFromString(markup, 'text/html').querySelector('[data-gallery-items]');
            if (!dataElement) throw new Error('Gallery data was not found in the response.');
            photos = JSON.parse(dataElement.textContent);
            console.log(`[gallery] feed ready in ${Math.round(performance.now() - start)}ms`);
          })
          .catch((error) => {
            feedPromise = null;
            throw error;
          });
      }
      return feedPromise;
    }

    async function loadNextBatch() {
      if (isLoading || (photos && nextIndex >= photos.length)) return;

      isLoading = true;
      const t0 = performance.now();
      const log = (label) => console.log(`[gallery] ${label} +${Math.round(performance.now() - t0)}ms`);
      status.textContent = 'Loading more photos.';
      log('loading message shown');

      try {
        await loadFeed();
        log('feed available');

        const batch = photos.slice(nextIndex, nextIndex + batchSize);
        if (!batch.length) {
          loadingText.hidden = true;
          sentinel.hidden = true;
          return;
        }

        const newItems = batch.map(createGalleryItem);
        container.append(...newItems);
        nextIndex += batch.length;

        if (container.isotopeInstance) {
          container.isotopeInstance.appended(newItems);
        }

        log('items added, waiting for images');
        await new Promise((resolve) => {
          const timeout = window.setTimeout(resolve, 20000);
          imagesLoaded(newItems, () => {
            window.clearTimeout(timeout);
            resolve();
          });
        });
        log('images loaded');
        if (container.isotopeInstance) container.isotopeInstance.layout();
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        if (nextIndex >= photos.length) loadingText.hidden = true;
        log('batch complete');

        if (typeof glightbox.reload === 'function') {
          glightbox.reload();
        }
        status.textContent = `Loaded ${nextIndex} of ${photos.length} photos.`;
        autoLoadPaused = false;

        if (nextIndex >= photos.length) {
          sentinel.hidden = true;
        }
      } catch (error) {
        autoLoadPaused = true;
        status.textContent = 'Could not load more photos. Retrying shortly.';
        window.setTimeout(() => {
          autoLoadPaused = false;
          if (observer) {
            observer.unobserve(sentinel);
            observer.observe(sentinel);
          }
        }, 5000);
      } finally {
        isLoading = false;
        if (observer && !sentinel.hidden && !autoLoadPaused) {
          observer.unobserve(sentinel);
          observer.observe(sentinel);
        }
      }
    }

    const observer = 'IntersectionObserver' in window
      ? new IntersectionObserver((entries) => {
          if (entries.some((entry) => entry.isIntersecting) && !autoLoadPaused) {
            console.log('[gallery] sentinel intersected, starting load');
            loadNextBatch();
          }
        }, { rootMargin: '0px 0px 700px 0px' })
      : null;

    // Warm the feed so the first scroll-triggered load needs no network round trip.
    const prefetch = () => loadFeed().catch(() => {});
    if ('requestIdleCallback' in window) requestIdleCallback(prefetch, { timeout: 3000 });
    else window.setTimeout(prefetch, 1500);

    if (observer) {
      observer.observe(sentinel);
    } else {
      const onScroll = () => {
        if (sentinel.hidden) return window.removeEventListener('scroll', onScroll);
        if (sentinel.getBoundingClientRect().top <= window.innerHeight + 700) loadNextBatch();
      };
      window.addEventListener('scroll', onScroll, { passive: true });
    }
  }

  initGalleryInfiniteScroll();

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