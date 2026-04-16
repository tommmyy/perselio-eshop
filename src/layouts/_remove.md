```
const gaContainer: string =
	(import.meta as any).env?.SHOP_GA_CONTAINER ??
	(typeof process !== 'undefined' ? process.env.SHOP_GA_CONTAINER : undefined) ??
	'';

		<script define:vars={{ gaContainer }}>
			if (gaContainer) {
				window.dataLayer = window.dataLayer || [];
				function gtag(){dataLayer.push(arguments);}
				gtag('js', new Date());

				gtag('config', gaContainer);
			}
		</script>
```
