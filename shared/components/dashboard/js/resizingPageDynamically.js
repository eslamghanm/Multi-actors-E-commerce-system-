$(document).ready(function() {
    // #region ===== Resizing Sidebar, Header And Page Content Dynamically =====
    let $sidebar = $('#sidebar');
    let $pageContent = $('#page-content');
    let $header = $('#header');

    function updateLayout() {
        let sidebarWidth = $sidebar.outerWidth();
        $pageContent.css('margin-left', sidebarWidth);

        let pageContentWidth = $pageContent.outerWidth();
        $header.css('width', pageContentWidth);

        let headerHeight = $header.outerHeight();
        $pageContent.css({
            'margin-top': headerHeight,
            'height': `calc(100vh - ${headerHeight}px)`
        });
    }

    // Initial run
    updateLayout();

    // Update on sidebar resize
    const resizeObserver = new ResizeObserver(updateLayout);
    resizeObserver.observe($sidebar[0]);

    // Update on window resize too
    $(window).on('resize', updateLayout);
    // #endregion ===== END Resizing =====
});