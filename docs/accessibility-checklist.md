# Accessibility Testing Checklist

This checklist ensures all Boombox components meet WCAG 2.1 AA standards and provide excellent user experience for all users.

## Automated Testing

### Jest + axe-core Integration

- [ ] **Component Tests**: All components have accessibility tests using `testAccessibility()`
- [ ] **Form Tests**: All forms tested with `testFormAccessibility()`
- [ ] **Navigation Tests**: Navigation components tested with `testNavigationAccessibility()`
- [ ] **Color Contrast**: Critical text tested with `testColorContrast()`

### Storybook Integration

- [ ] **Story Coverage**: All component stories include accessibility addon
- [ ] **Interaction Testing**: Interactive components have keyboard/focus tests
- [ ] **Visual Testing**: Stories cover error states, loading states, and edge cases

### Lighthouse CI

- [ ] **Accessibility Score**: Minimum 90% accessibility score
- [ ] **Performance**: Core Web Vitals within Boombox targets
- [ ] **SEO**: Proper heading hierarchy and semantic structure

## Manual Testing Checklist

### Keyboard Navigation

- [ ] **Tab Order**: Logical tab order through all interactive elements
- [ ] **Focus Indicators**: Visible focus indicators on all focusable elements
- [ ] **Skip Links**: Skip links present and functional on pages with navigation
- [ ] **Escape Key**: Modal/dropdown closes with Escape key
- [ ] **Arrow Keys**: List/menu navigation works with arrow keys
- [ ] **Enter/Space**: Buttons and links activate with Enter/Space keys

### Screen Reader Testing

- [ ] **VoiceOver (macOS)**: Test with VoiceOver screen reader
- [ ] **NVDA (Windows)**: Test with NVDA screen reader (if available)
- [ ] **Announcements**: Dynamic content changes are announced
- [ ] **Labels**: All form controls have proper labels
- [ ] **Headings**: Proper heading hierarchy (H1 → H2 → H3)
- [ ] **Landmarks**: Page regions are properly identified

### Visual Testing

- [ ] **Color Contrast**: Text meets 4.5:1 contrast ratio (AA)
- [ ] **Enhanced Contrast**: Important text meets 7:1 ratio (AAA preferred)
- [ ] **Color Blindness**: Interface works without relying solely on color
- [ ] **Zoom**: Interface works at 200% zoom level
- [ ] **High Contrast**: Interface works with high contrast mode

### Motor Accessibility

- [ ] **Target Size**: Interactive elements are at least 44x44px
- [ ] **Spacing**: Adequate spacing between interactive elements
- [ ] **Drag/Drop**: Alternative methods for drag-and-drop interactions
- [ ] **Timeouts**: No time limits or generous timeout periods

## Component-Specific Checklists

### Forms

- [ ] **Labels**: All inputs have associated labels
- [ ] **Required Fields**: Required fields clearly marked
- [ ] **Error Messages**: Clear, specific error messages
- [ ] **Error Association**: Errors properly associated with fields
- [ ] **Field Groups**: Related fields grouped with fieldset/legend
- [ ] **Validation**: Real-time validation doesn't interfere with screen readers

### Navigation

- [ ] **Landmarks**: Navigation wrapped in `<nav>` element
- [ ] **Current Page**: Current page/section clearly indicated
- [ ] **Breadcrumbs**: Breadcrumbs use proper ARIA labels
- [ ] **Menu States**: Menu open/closed states properly communicated

### Images

- [ ] **Alt Text**: All images have meaningful alt text
- [ ] **Decorative Images**: Decorative images have empty alt=""
- [ ] **Complex Images**: Complex images have detailed descriptions
- [ ] **Image Maps**: Image maps have proper alt text for areas

### Tables

- [ ] **Headers**: Tables have proper header cells (th)
- [ ] **Caption**: Tables have descriptive captions
- [ ] **Scope**: Header scope properly defined for complex tables
- [ ] **Summary**: Complex tables have summary information

### Modals/Dialogs

- [ ] **Focus Trap**: Focus trapped within modal
- [ ] **Initial Focus**: Focus moves to appropriate element when opened
- [ ] **Return Focus**: Focus returns to trigger when closed
- [ ] **ARIA Attributes**: Proper role, aria-labelledby, aria-modal
- [ ] **Background**: Background content properly hidden

### Dynamic Content

- [ ] **Live Regions**: Dynamic updates use ARIA live regions
- [ ] **Loading States**: Loading states communicated to screen readers
- [ ] **Error States**: Error states properly announced
- [ ] **Success States**: Success messages properly announced

## Boombox-Specific Considerations

### Quote/Booking Flow

- [ ] **Multi-step Forms**: Progress clearly communicated
- [ ] **Form Validation**: Inline validation accessible
- [ ] **Price Updates**: Price changes announced to screen readers
- [ ] **Service Selection**: Service options clearly labeled

### Customer Dashboard

- [ ] **Data Tables**: Order/appointment tables accessible
- [ ] **Status Updates**: Status changes properly communicated
- [ ] **Action Buttons**: Clear button labels and purposes
- [ ] **Filtering**: Filter controls accessible

### Driver/Mover Interface

- [ ] **Map Integration**: Map interactions have keyboard alternatives
- [ ] **Route Information**: Route details available to screen readers
- [ ] **Status Updates**: Job status changes properly announced
- [ ] **Communication**: Message/call features accessible

### Admin Interface

- [ ] **Complex Tables**: Sortable tables with proper headers
- [ ] **Bulk Actions**: Bulk selection and actions accessible
- [ ] **Data Visualization**: Charts have text alternatives
- [ ] **Search/Filter**: Search interfaces fully accessible

## Testing Tools

### Browser Extensions

- [ ] **axe DevTools**: Run axe accessibility checker
- [ ] **WAVE**: Web Accessibility Evaluation Tool
- [ ] **Lighthouse**: Accessibility audit in Chrome DevTools
- [ ] **Color Oracle**: Color blindness simulator

### Manual Testing Tools

- [ ] **Keyboard Only**: Navigate site using only keyboard
- [ ] **Screen Reader**: Test with actual screen reader software
- [ ] **Zoom**: Test interface at 200% zoom
- [ ] **High Contrast**: Test with OS high contrast mode

### Automated Testing

```bash
# Run accessibility tests
pnpm test -- --testPathPattern=accessibility

# Run Storybook accessibility tests
pnpm run storybook:test

# Run Lighthouse accessibility audit
pnpm run lighthouse
```

## Common Issues to Watch For

### Typography

- [ ] **Font Size**: Minimum 16px for body text
- [ ] **Line Height**: Adequate line height (1.4+)
- [ ] **Line Length**: Reasonable line length (45-75 characters)

### Layout

- [ ] **Responsive Design**: Works on mobile and desktop
- [ ] **Orientation**: Works in both portrait and landscape
- [ ] **Reflow**: Content reflows properly at different sizes

### Interactions

- [ ] **Hover States**: Don't rely solely on hover for important info
- [ ] **Touch Targets**: Adequate size for touch interfaces
- [ ] **Gestures**: Provide alternatives to complex gestures

## Documentation

- [ ] **Component Docs**: Each component documents accessibility features
- [ ] **Usage Examples**: Examples show proper accessibility implementation
- [ ] **Testing Notes**: Document any special accessibility considerations

## Sign-off

- [ ] **Developer Review**: Code reviewed for accessibility
- [ ] **Automated Tests**: All automated tests passing
- [ ] **Manual Testing**: Manual testing completed
- [ ] **Stakeholder Approval**: Accessibility requirements approved

---

**Remember**: Accessibility is not a one-time check but an ongoing commitment to inclusive design. Test early, test often, and always consider the diverse needs of your users. 