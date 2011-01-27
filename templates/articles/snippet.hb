<ul>
    {{#rows}}
        <li class="article-snippet">
            <div class="time-wrapper">
                <time datetime="{{posted_on}}" class="fancy-time"> </time>
            </div>

            <div class="snippet-wrapper">
                <a class="header-link" href="{{link}}"><h3>{{title}}</h3></a>

                <p class="snippet">{{summary}}</p>

                <div class="more">
                    <a href="{{link}}">Read More...</a>
                </div>
            </div>
        </li>
    {{/rows}}
</ul>
