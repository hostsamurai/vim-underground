{{#rows}}
    <li class="article-snippet">
        <div class="time-wrapper">
            <time datetime="{{posted_on}}" class=fancy-time></time>
        </div>

        <div class="snippet-wrapper">
            <a class="header-link" href="{{link}}"><h3>{{title}}</h3></a>

            <div class="summary">
                <a href="{{link}}"><img src="{{thumb_url}}" class="preview" width="90" height="90"/></a>

                <p>{{summary}}</p>
            </div>

            <div class="more">
                <a href="{{link}}">Read More&hellip;</a>
            </div>
        </div>
    </li>
{{#rows}}
