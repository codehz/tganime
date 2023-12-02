Bun.build({
	entrypoints: ['src/index.ts'],
	outdir: 'dist',
	target: 'browser',
	define: {
		BOT_TOKEN: JSON.stringify(process.env.BOT_TOKEN),
		BOT_INFO: process.env.BOT_INFO!,
		BOT_SECRET: JSON.stringify(process.env.BOT_SECRET),
	},
	minify: true,
}).then((x) => {
	if (x.logs.length) {
		console.log(x.logs.join('\n'));
	}
	if (!x.success) process.exit(1);
});
