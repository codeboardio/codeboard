/**
 * Service that provides WebSocket functionality, specifically designed
 * to work well with the Mantra backend service.
 *
 * Calling the service returns the object with functions to connect, close
 * or send data over the WebSocket.
 *
 * Created by hce on 28/08/15.
*/


angular.module('codeboardApp')
  .factory('WebsocketSrv', ['$websocket', '$log', function ($websocket, $log) {

    // reference to the WS instance
    var ws = null;


    /**
     * Function to connects to a websocket.
     * @param {string} aWeSocketUrl the Url of the websocket
     * @param {string} aStartUrl
     * @param onWSDataCallback
     * @param onWSCloseCallback
     */
    var connect = function(aWeSocketUrl, onWSOpenCallback, onWSDataCallback, onWSCloseCallback) {

      // create the WS connection
      ws = $websocket(aWeSocketUrl);

      // when the WS is open, we call the start Url
      ws.onOpen(function() {
        onWSOpenCallback();
      });

      // when a new message is received over the WS
      ws.onMessage(function(msg) {
          var reader = new FileReader();
          reader.addEventListener("loadend", function() {
              onWSDataCallback(reader.result);
          });
          reader.readAsText(msg.data);
      });

      // when the WS is closed
      ws.onClose(function() {
        $log.debug('websocketSrvjs.onClose: the websocket connection was closed!');
        onWSCloseCallback();
      });

      // when there's an error
      ws.onError(function() {
        $log.debug('websocketSrvjs.onError: websocket error');
      });

    };

    /**
     * Closes the websocket.
     * @param {boolean} [aForceClose=false] force the closing
     */
    var close = function(aForceClose) {
      var lForceClose = aForceClose || false;
      ws.close(lForceClose);
    };

    /**
     * Send data over the WebSocket.
     * @param {string} aInputData - the data to send
     */
    var sendData = function(aInputData) {
      if (ws && ws.readyState === 1) {
        // readyState 1 is: connection is open and ready to communicate
        // (see: https://developer.mozilla.org/en-US/docs/Web/API/WebSocket#Ready_state_constants)
        $log.debug('WebsocketSrvjs.sendData: sending data ' + aInputData);
        ws.send(aInputData);
      }
      else {
        $log.debug('WebsocketSrvjs.sendData: not sending data; WS not initialized or readyState not 1');
      }
    }

    // the object we return
    return {
      connect: connect,
      close: close,
      sendData: sendData
    };

  }]);
