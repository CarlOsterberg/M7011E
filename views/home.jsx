var React = require('react');

function Home(ssn) {
    return (
    <html lang="en" className="h-100"><head><meta httpEquiv="Content-Type" content="text/html; charset=UTF-8"/>

        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no"/>
            <meta name="description" content=""/>
                <meta name="author" content="Mark Otto, Jacob Thornton, and Bootstrap contributors"/>
                    <meta name="generator" content="Jekyll v4.1.1"/>
                        <title>Placeholder</title>

                        <link rel="canonical" href="https://getbootstrap.com/docs/4.5/examples/sticky-footer-navbar/"/>
                            <link href="site_files/bootstrap.min.css" rel="stylesheet" crossOrigin="anonymous"/>




                                <link href="site_files/sticky-footer-navbar.css" rel="stylesheet"/>
    </head>
    <body className="text-center">
    <header>

        <nav className="navbar navbar-expand-md navbar-dark fixed-top bg-dark">
            <div className="collapse navbar-collapse" id="navbarCollapse">
                <ul className="navbar-nav mr-auto">
                    <li className="nav-item active">
                        <a className="nav-link" href="home"><svg width="1em" height="1em" viewBox="0 0 16 16" className="bi bi-house-fill" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" d="M8 3.293l6 6V13.5a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 13.5V9.293l6-6zm5-.793V6l-2-2V2.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5z"/>
                            <path fillRule="evenodd" d="M7.293 1.5a1 1 0 0 1 1.414 0l6.647 6.646a.5.5 0 0 1-.708.708L8 2.207 1.354 8.854a.5.5 0 1 1-.708-.708L7.293 1.5z"/>
                        </svg></a>
                    </li>
                    <li className="nav-item">
                        <a className="nav-link" href="personal"><svg width="1em" height="1em" viewBox="0 0 16 16" className="bi bi-person-fill" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" d="M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1H3zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>
                        </svg></a>
                    </li>

                    <li className="nav-item">
                        <a className="nav-link" href="settings"><svg width="1em" height="1em" viewBox="0 0 16 16" className="bi bi-three-dots-vertical" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" d="M9.5 13a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"/>
                        </svg></a>
                    </li>
                </ul>
                <a className="navbar-text"
                   tabIndex="-1">{ssn.username}</a>
        </div>
    </nav>
    </header>


    <main role="main" className="flex-shrink-0">
        <div className="container" >
            <h1 className="mt-5">Home</h1>
            <p className="lead">Put a price on emotion
                I'm looking for something to buy
                You've got my devotion
                But man, I can hate you sometimes
                I don't want to fight you
                And I don't wanna sleep in the dirt
                We'll get the drinks in
                So I'll get to thinking of her
                We'll be a fine line</p>
            <form className="form-signin" action="/login_error" method="post" className="align-content-center">
                <h4 className="h3 mb-3 font-weight-normal">You are not logged in!</h4>
                <a href="login" >Log in to see your personal page</a>
            </form>
    </div>

</main>
        </body></html>
    );
}

module.exports = Home;