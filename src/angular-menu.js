/**
 * @license ngMenu v1.0.0
 * (c) 2014 ESD Engineering & Service, SRL. http://esd.com.do
 * License: Private
 */
(function(window, angular, undefined) {'use strict';

var $menuMinErr = angular.$$minErr('$menu');

angular.module('ngMenu', ['ng'])

    .provider('$menu', function () {

        var provider = this;

        /**
         * Menus Object
         * @type {Object}
         */
        this.$$menus = {default: []};

        /**
         * Default permissions handler, will return always true
         * @return {boolean}
         */
        this.$$permissionsHandler = function () {
            return function (permissions) { return true; };
        };

        /**
         * Add an item to the given menu
         *
         * @param  {Object} item
         *   {
         *     url: 'tasks',
         *     label: 'Tasks',
         *     permissions: 'tasks.index',
         *     order: 300,
         *     subitem: [
         *       {
         *         url: 'task/summary',
         *         label: 'Task Summary',
         *         permissions: ['tasks.update', 'tasks.destroy']
         *       }
         *     ]
         *   }
         * @param  {String} menu
         * @return {self}
         */
        this.item = function (item, menu, isSubitem) {

            menu = menu || 'default';

            isSubitem = isSubitem || false;

            if (typeof menu  == 'boolean') {
                isSubitem = menu;
                menu = 'default';
            }

            // if we're using a menu that is not the default, create the empty array
            if (menu !== 'default' && !angular.isArray(this.$$menus[menu])) {
                this.$$menus[menu] = [];
            }

            if (!angular.isObject(item)) {
                return this;
            }

            if ( !isSubitem || (isSubitem && !this.hasItem(menu, item.label)) ) {

                this.$$menus[menu].push(angular.extend({
                    icon: 'bolt',
                    order: 0
                }, item));

                return this;
            }

            // No label was sent for the item? (return)
            if (!item.label) {
                console.log('angular-menu: subitem sent without item for menu ' +menu+ '. Will be ignored.');
                return this;
            }

            // Extend the item with the label of the sent subitem
            angular.forEach(this.$$menus[menu], function (entry, index) {
                if (entry.label == item.label) {
                    angular.forEach(item.subitems, function (subEntry) {
                        entry.subitems.push( subEntry );
                    });
                }
            });

            return this;
        };

        this.hasItem = function (menu, label) {
            var found = false;

            angular.forEach(this.$$menus[menu], function (entry, index) {
                if (entry.label == label) {
                    found = true;
                }
            });

            return found;
        };

        /**
         * How the menu will handle the permission
         *
         * Usage:
         *
         *  $menuProvider.permissions(function ($permissions) {
         *
         *      return function (permissions) {
         *          return $permissions(permissions);
         *      };
         *  });
         *
         * @param  {function} manager
         * @return {Boolean}
         */
        this.permissions = function (handler) {
            this.$$permissionsHandler = handler;
        };

        /**
         * Get the given menu
         * @return {Object}
         */
        this.$get = function ($injector) {

            var compare, permissionsHandler;

            compare = function (a, b) {
                if (a.order < b.order) { return -1; }
                if (a.order > b.order) { return 1; }
                return 0;
            };

            permissionsHandler = $injector.invoke(provider.$$permissionsHandler);

            // Sort the items
            angular.forEach(provider.$$menus, function (menu, index) {
                this[index].sort(compare);
            }, provider.$$menus);

            // filter the items only with the authorized items
            var authorizedItems = function (items) {

                var filteredItems = [];

                angular.forEach(items, function (item) {

                    if (item.hasOwnProperty('permissions') && !permissionsHandler(item.permissions)) {
                        return false;
                    }

                    if (angular.isObject(item.subitems)) {
                        // call itself recursively returning only the authorized items
                        item.subitems = authorizedItems(item.subitems);
                    }

                    this.push(item);

                }, filteredItems);

                return filteredItems;
            };

            return function (menu) {
                return authorizedItems(provider.$$menus[menu || 'default']);
            };
        };

    });


})(window, window.angular);
