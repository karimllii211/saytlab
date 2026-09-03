/* Meta (Facebook) Pixel — bütün səhifələrdə PageView izləməsi.
   Meta-nın standart snippet-i; əvvəllər inline <script> bloku kimi verilirdi, CSP-ni
   sərt saxlamaq üçün (script-src 'unsafe-inline' OLMASIN — preloader.js / legal.js ilə
   eyni məntiq) ayrıca fayla köçürüldü. MƏNTİQ DƏYİŞMƏYİB.
   Pixel ID: 4331233943803470 */
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '4331233943803470');
fbq('track', 'PageView');
