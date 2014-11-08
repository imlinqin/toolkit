define([
    'jquery',
    './component',
    '../events/swipe'
], function($, Toolkit) {

Toolkit.OffCanvas = Toolkit.Component.extend({
    name: 'OffCanvas',
    version: '1.5.0',

    /** The parent container. */
    container: null,

    /** The primary content wrapper. */
    primary: null,

    /** Secondary sibling sidebars. */
    secondary: null,

    /** The side the primary sidebar is located. */
    side: 'left',

    /** The opposite of `side`. */
    opposite: 'right',

    /** Will be true once document ready has triggered. We must use a flag as it can be called multiple times. */
    _loaded: false,

    /**
     * Initialize off canvas.
     *
     * @param {jQuery} element
     * @param {Object} [options]
     */
    constructor: function(element, options) {
        this.element = element = $(element).attr('role', 'complementary').conceal();
        this.options = options = this.setOptions(options, element);

        var events = {}, animation = options.animation;

        // Touch devices cannot use squish
        if (Toolkit.isTouch && animation === 'squish') {
            options.animation = animation = 'push';
        }

        // Cannot have multiple non-overlayed or non-squished sidebars open
        if (animation !== 'on-top' && animation !== 'squish') {
            options.hideOthers = true;
        }

        // Setup container
        this.container = element.parent().addClass(animation);
        this.primary = element.siblings('[data-offcanvas-content]').attr('role', 'main');
        this.secondary = element.siblings('[data-offcanvas-sidebar]');

        // Determine the side
        this.side = element.data('offcanvas-sidebar') || 'left';
        this.opposite = (this.side === 'left') ? 'right' : 'left';

        // Initialize events
        events['ready document'] = 'onReady';
        events['resize window'] = 'onResize';

        if (options.swipe) {
            if (this.side === 'left') {
                events['swipeleft element'] = 'hide';
                events['swiperight container'] = 'onSwipe';
            } else {
                events['swipeleft container'] = 'onSwipe';
                events['swiperight element'] = 'hide';
            }
        }

        if (options.selector) {
            events['click document ' + options.selector] = 'toggle';
        }

        this.events = events;

        this.initialize();
    },

    /**
     * Hide sidebar when destroying.
     */
    destructor: function() {
        this.hide();
    },

    /**
     * Hide the sidebar and reset the container.
     */
    hide: function() {
        this.fireEvent('hiding');

        this.container.removeClass('move-' + this.opposite);

        this.element
            .conceal()
            .removeClass('is-expanded')
            .aria('expanded', false);

        if (this.options.stopScroll) {
            $('body').removeClass('no-scroll');
        }

        this.fireEvent('hidden');
    },

    /**
     * Show the sidebar and squish the container to make room for the sidebar.
     * If hideOthers is true, hide other open sidebars.
     */
    show: function() {
        var options = this.options;

        if (options.hideOthers) {
            this.secondary.each(function() {
                var sidebar = $(this);

                if (sidebar.hasClass('is-expanded')) {
                    sidebar.toolkit('offCanvas', 'hide');
                }
            });
        }

        this.fireEvent('showing');

        this.container.addClass('move-' + this.opposite);

        this.element
            .reveal()
            .addClass('is-expanded')
            .aria('expanded', true);

        if (options.stopScroll) {
            $('body').addClass('no-scroll');
        }

        this.fireEvent('shown');
    },

    /**
     * Toggle between show and hide states.
     */
    toggle: function() {
        if (this.element.hasClass('is-expanded')) {
            this.hide();
        } else {
            this.show();
        }
    },

    /**
     * On page load, immediately display the sidebar.
     * Remove transitions from the sidebar and container so there is no page jumping.
     * Also disable `hideOthers` so multiple sidebars can be displayed on load.
     *
     * @private
     */
    onReady: function() {
        if (!this.options.openOnLoad || this._loaded) {
            return;
        }

        var sidebar = this.element,
            inner = this.primary,
            transClass = 'no-transition';

        sidebar.addClass(transClass);
        inner.addClass(transClass);

        this.show();

        // Transitions will still occur unless we place in a timeout
        setTimeout(function() {
            sidebar.removeClass(transClass);
            inner.removeClass(transClass);
        }, 15); // IE needs a minimum of 15

        this._loaded = true;
    },

    /**
     * Triggered when the page is resized.
     *
     * @private
     */
    onResize: function() {
        this.fireEvent('resize');
    },

    /**
     * When swiping on the container, don't trigger a show if we are trying to hide a sidebar.
     *
     * @private
     * @param {jQuery.Event} e
     */
    onSwipe: function(e) {
        e.preventDefault();

        var target = $(e.target),
            selector = '[data-offcanvas-sidebar]';

        if (target.is(selector) || target.parents(selector).length) {
            return;
        }

        this.show();
    }

}, {
    selector: '',
    animation: 'push',
    openOnLoad: false,
    hideOthers: true,
    stopScroll: true,
    swipe: Toolkit.isTouch
});

Toolkit.create('offCanvas', function(options) {
    return new Toolkit.OffCanvas(this, options);
});

return Toolkit;
});