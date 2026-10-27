</main>

<script>
// Hamburger mobile menu toggle
document.addEventListener('DOMContentLoaded', function() {
    const hamburger = document.getElementById('hamburger-btn');
    const menu = document.getElementById('navbar-menu');
    
    if (hamburger && menu) {
        hamburger.addEventListener('click', function(e) {
            e.stopPropagation();
            menu.classList.toggle('open');
        });
        
        // Close menu if user clicks outside
        document.addEventListener('click', function(e) {
            if (menu.classList.contains('open') && !menu.contains(e.target) && !hamburger.contains(e.target)) {
                menu.classList.remove('open');
            }
        });
    }
});
</script>
</body>
</html>
