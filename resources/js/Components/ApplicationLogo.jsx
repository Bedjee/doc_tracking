export default function ApplicationLogo({
    size = 'md',
    className = '',
    alt = 'DocTrak',
    white = false,
    ...props
}) {
    // Size presets — tuned for logo marks and full wordmarks.
    const sizes = {
        xs: 'h-5 w-auto',       // inline / tight spots
        sm: 'h-7 w-auto',       // top bar compact
        md: 'h-9 w-auto',       // default
        lg: 'h-12 w-auto',      // sidebar brand block
        xl: 'h-16 w-auto',      // login / hero
        '2xl': 'h-20 w-auto',   // marketing / splash
        // Square variant for icon-only usage inside a circle/square badge
        icon: 'h-6 w-6',
        'icon-lg': 'h-7 w-7',
    };

    // `brightness-0` flattens every visible pixel to black,
    // then `invert` flips it to pure white — regardless of the original color.
    const whiteFilter = white ? 'brightness-0 invert' : '';

    return (
        <img
            src="/images/doctrak.png"
            alt={alt}
            draggable="false"
            className={`object-contain ${sizes[size] ?? sizes.md} ${whiteFilter} ${className}`}
            {...props}
        />
    );
}