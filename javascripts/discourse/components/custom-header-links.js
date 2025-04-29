import Component from "@glimmer/component";
import { dasherize } from "@ember/string";
import { action } from "@ember/object";
import { tracked } from "@glimmer/tracking";

export default class CustomHeaderLinks extends Component {


  @tracked activeTab = "Forum"; // Set "Forum" as the default active tab

  get shouldShow() {
    return settings.custom_header_links?.length > 0;
  }

  constructor() {
    super(...arguments);
    // Initialize - show custom search only when the active tab is not Forum
    this.showCustomSearch = this.activeTab !== "Forum";
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

      const linkClass = `${dasherize(linkText)}-custom-header-links`; // legacy name

      const anchorAttributes = {
        title: linkTitle,
        href: linkHref,
        target: target === "self" ? "" : "_blank",
      };

      result.push({
        device: `headerLink--${device}`,
        hideOnScroll: `headerLink--${hideOnScroll}`,
        locale: locale ? `headerLink--${locale}` : null,
        linkClass,
        anchorAttributes,
        linkText,
      });

      return result;
    }, []);
  }

  @action
  toggleTab(tabName) {
    // If the tab is already active, deactivate it
    if (this.activeTab !== tabName) {
      // Otherwise, set it as active
      this.activeTab = tabName;
      // Show custom search only when Forum tab is NOT active
      this.showCustomSearch = tabName !== "Forum";
    }
    
    // After toggling, manage the visibility of search bars
    this._toggleSearchBars();
    
    return false; // Prevent default link behavior
  }
  
  @action
  searchHobbyDB() {
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
            window.open(hobbydbUrl, '_blank', 'noopener,noreferrer');
            
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
    }
  }

  // @action
  // handleKeyPress(event) {
  //   // Check if the Enter key was pressed
  //   if (event.key === "Enter") {
  //     // Prevent the default form submission behavior
  //     event.preventDefault();
  //     // Call the forum search function
  //     this.searchForum();
  //     return false;
  //   }
  //   return true;
  // }
}
