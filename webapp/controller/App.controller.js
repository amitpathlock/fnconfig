sap.ui.define(
    [
        "sap/ui/core/mvc/Controller"
    ],
    function(BaseController) {
      "use strict";
      /**
	 * Called when a view is instantiated and its controls (if available) have been created.
	 * Can be used to modify the view before it is displayed, to bind event handlers, and to do other one-time initialization.
	 * Store the instance of the Router class in the variable referenced by the controller.
	 * Call the Router attachParternPathed event
	 * @memberOf pl.dac.apps.fnconfig.controller.DataAttributes
	 */
      return BaseController.extend("pl.dac.apps.fnconfig.controller.App", {
        onInit: function() {
        }
      });
    }
  );
  