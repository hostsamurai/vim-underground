<div class="abs-form-container">
    <form id="new-article" class="basic-form abs-form" method="post" action="#/new">
        <span class="symbol">o</span>
        <a href="#" class="close"><span>⊗</span> Close</a>

        <h2>Submit an Article</h2>

        <label for="lol1">LOL</label>
        <input type="text" name="lol1"/>
        <label for="lol2">LOL</label>
        <input type="text" name="lol2"/>

        <label for="url"><span class="input-num">01</span> URL</label>
        <input class="h5-url" autofocus="true" type="url" name="link" placeholder="http://" title="The source URL of the article" required maxlength="100"/>

        <label for="title"><span class="input-num">02</span> Title</label>
        <input class="h5-minLength" type="text" name="title" required/>

        <label for="description"><span class="input-num">03</span> Summary</label>
        <textarea name="summary" rows="10" cols="30" required maxlength="200"></textarea>

        <input type="submit" value="Submit" />
    </form>
</div>
