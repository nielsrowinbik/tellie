import Document, { Html, Head, Main, NextScript } from 'next/document';

class MyDocument extends Document {
    render() {
        return (
            <Html className="overscroll-none" lang="en">
                <Head>
                    <meta name="theme-color" content="#60A5FA" />
                </Head>
                <body className="min-h-screen bg-blue-400 text-white">
                    <Main />
                    <NextScript />
                </body>
            </Html>
        );
    }
}

export default MyDocument;
