import Component from "@glimmer/component";
import { dasherize } from "@ember/string";
import { action } from "@ember/object";
import { inject as service } from "@ember/service";
import { tracked } from "@glimmer/tracking";

export default class CustomHeaderLinks extends Component {
  @service router;
  @service search;
  @service appEvents; // Add appEvents service
  @tracked activeTab = "Forum"; // Set "Forum" as the default active tab
  @tracked showCustomSearch = false; // By default, don't show our custom search (show Discourse search instead)

  constructor() {
    super(...arguments);
    // Initialize - show custom search only when the active tab is not Forum
    this.showCustomSearch = this.activeTab !== "Forum";
    // Initialize the search bar visibility when component loads
    this._toggleSearchBars();
  }

  get shouldShow() {
    return settings.custom_header_links?.length > 0;
  }

  get shouldShowSeachbar() {
    return this.activeTab !== 'Forum';
  }

  get links() {
    return settings.custom_header_links.reduce((result, link) => {
      const linkText = link.text;
      const linkTitle = link.title;
      const linkHref = link.url;
      const target = link.target;
      const hideOnScroll = link.hide_on_scroll;
      const locale = link.locale;
      const device = link.view;

      if (!linkText || (locale && document.documentElement.lang !== locale)) {
        return result;
      }

      const linkClass = `${dasherize(linkText)}-custom-header-links`;
      const isActive = this.activeTab === linkText;

      const anchorAttributes = {
        title: linkTitle,
        href: linkHref,
      };

      result.push({
        device: device ? `headerLink--${device}` : "",
        hideOnScroll: hideOnScroll ? "headerLink--hide-on-scroll" : "",
        locale: locale ? `headerLink--${locale}` : "",
        linkClass,
        anchorAttributes,
        linkText,
        isActive
      });

      return result;
    }, []);
  }
  
  @action
  toggleTab(tabName) {
    // If the tab is already active, deactivate it
    if (this.activeTab === tabName) {
      // this.activeTab = null;
      // this.showCustomSearch = true; // Show custom search when no tab is active
    } else {
      // Otherwise, set it as active
      this.activeTab = tabName;
      // Show custom search only when Forum tab is NOT active
      this.showCustomSearch = tabName !== "Forum";
      
      // Emit event that the activeTab has changed
      this.appEvents.trigger("activeTab:changed", tabName);
    }
    
    // After toggling, manage the visibility of search bars
    this._toggleSearchBars();
    
    return false; // Prevent default link behavior
  }
  
  _toggleSearchBars() {
    // Delay the execution to ensure the DOM has been updated
    setTimeout(() => {
      // Get references to both search elements
      const discourseSearch = document.querySelector(".d-header-icons .search-dropdown");
      const customSearch = document.querySelector(".custom-header-links").closest(".header-container").querySelector(".search-actions");
      const customDefaultSearch = document.querySelector(".floating-search-input-wrapper");
      
      if (this.showCustomSearch) {
        // Show our custom search and hide Discourse search
        if (customSearch) customSearch.style.display = "flex";
        // Don't hide the search icon, but add a class to it so we can target it with CSS if needed
        if (discourseSearch) discourseSearch.classList.add("search-hidden");
      } else {
        // Hide our custom search and ensure Discourse search is visible
        if (customSearch) customSearch.style.display = "none";
        if (discourseSearch) discourseSearch.classList.remove("search-hidden");
      }
      
      // If Forum is selected, make sure to focus or expand Discourse's search
      if (this.activeTab === "Forum") {
        if (customDefaultSearch) customDefaultSearch.style.display = "flex";
        // Find Discourse's search button/icon
        const discourseSearchButton = document.querySelector(".d-header-icons .search-dropdown .search-icon");
        // If it exists, we might want to simulate a click to expand it
        // Uncomment this if you want it to automatically expand
        if (discourseSearchButton) discourseSearchButton.click();
      } else {
        if (customDefaultSearch) customDefaultSearch.style.display = "none";
      }
    }, 0);
  }
  
  @action
  handleSearch() {
    this.searchForum();
  }
  
  @action
  searchForum() {
    // This should only run for non-Forum tabs
    if (!this.showCustomSearch) {
      return;
    }
    
    const searchInput = document.querySelector(".search-bar input");
    const searchValue = searchInput ? searchInput.value.trim() : "";
    
    if (searchValue) {
      if (this.activeTab) {
        // When there's an active tab, open search in a new tab with specific URLs based on activeTab
        try {
          const encodedSearchValue = encodeURIComponent(searchValue);
          let hobbydbUrl;
          
          // Set URL based on active tab
          switch (this.activeTab) {
            case "Database":
              hobbydbUrl = `https://www.hobbydb.com/marketplaces/hobbydb/catalog_items?filters[q][0]=${encodedSearchValue}`;
              break;
            case "Subjects":
              hobbydbUrl = `https://www.hobbydb.com/marketplaces/hobbydb/subjects?filters[q][0]=${encodedSearchValue}`;
              break;
            case "Market":
              hobbydbUrl = `https://www.hobbydb.com/marketplaces/hobbydb/collectibles/for_sale_search?filters[q][0]=${encodedSearchValue}`;
              break;
            case "Members":
              hobbydbUrl = `https://www.hobbydb.com/marketplaces/hobbydb/users?order[name]=collectible_count&order[sort]=desc&filters[q][0]=${encodedSearchValue}&page=1`;
              break;
            case "Local":
              hobbydbUrl = `https://www.hobbydb.com/marketplaces/hobbydb/local?filters[q][0]=${encodedSearchValue}`;
              break;
            case "Blog":
              hobbydbUrl = `https://blog.hobbydb.com/?s=${encodedSearchValue}`;
              break;
            default:
              break;
          }
          
          // Open in a new tab
          if (hobbydbUrl) {
            window.open(hobbydbUrl, '', 'noopener,noreferrer');
            
            // Clear the search input after opening the new tab
            if (searchInput) {
              searchInput.value = '';
            }
          }
          
          // Return early to prevent default behavior
          return;
        } catch (error) {
          console.error("Error opening HobbyDB search:", error);
          // Fall through to default behavior if there's an error
        }
      }
      
      // No active tab or error occurred, use the original functionality
      // Use Discourse's search service if available (preferred method)
      if (this.search && typeof this.search.query === "function") {
        this.search.query(searchValue);
      } else {
        // Fallback: Navigate to search page with the query
        this.router.transitionTo("full-page-search", {
          queryParams: { q: searchValue }
        });
      }
    } else {
      // If no search value, just navigate to search page
      this.router.transitionTo("full-page-search");
    }
  }
  
  @action
  handleKeyPress(event) {
    // Check if the Enter key was pressed
    if (event.key === "Enter") {
      // Prevent the default form submission behavior
      event.preventDefault();
      // Call the forum search function
      this.searchForum();
      return false;
    }
    return true;
  }
}