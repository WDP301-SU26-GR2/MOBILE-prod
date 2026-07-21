import React, { useRef, forwardRef, useImperativeHandle } from 'react';
import { WebView } from 'react-native-webview';

export interface RecaptchaV3Ref {
  execute: (action?: string) => void;
}

interface RecaptchaV3Props {
  siteKey: string;
  url: string; // Fake URL to bypass origin restrictions
  onReceiveToken: (token: string) => void;
}

export const RecaptchaV3 = forwardRef<RecaptchaV3Ref, RecaptchaV3Props>(
  ({ siteKey, url, onReceiveToken }, ref) => {
    const webViewRef = useRef<WebView>(null);

    useImperativeHandle(ref, () => ({
      execute: (action = 'homepage') => {
        const js = `
          if (window.grecaptcha) {
            window.grecaptcha.ready(function() {
              window.grecaptcha.execute('${siteKey}', { action: '${action}' }).then(function(token) {
                window.ReactNativeWebView.postMessage(token);
              });
            });
          }
          true;
        `;
        webViewRef.current?.injectJavaScript(js);
      }
    }));

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <script src="https://www.google.com/recaptcha/api.js?render=${siteKey}"></script>
        </head>
        <body></body>
      </html>
    `;

    return (
      <WebView
        ref={webViewRef}
        source={{ html, baseUrl: url }}
        onMessage={(event) => {
          onReceiveToken(event.nativeEvent.data);
        }}
        style={{ width: 0, height: 0, opacity: 0 }}
        containerStyle={{ width: 0, height: 0, display: 'none' }}
        javaScriptEnabled
        originWhitelist={['*']}
        bounces={false}
      />
    );
  }
);
