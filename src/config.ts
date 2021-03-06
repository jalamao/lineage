/**
 * Created by Holger Stitz on 18.01.2017.
 */

export class Config {
  public static curvedLines = true;
  public static vertOrientation = true;
  public static collapseParents = true;
  public static showLifeLines = false;
  public static showAgeLabels = false;

  public static glyphSize = 8;
  public static hiddenGlyphSize = 4;
  public static spaceBetweenGenerations = 4;

  public static svgHeight = 600;
  public static margin = {
        axisTop: 80,
        top: 5,
        right: 10,
        bottom: 60,
        left: 40
    };

  public static defaultAttrs = {
    got:['name', 'year','gender','sequence','book_death_chapter'],
    path:['name','degree', 'pathways'],
    coauth:['tvcg_publications','chi_publications','year','cited']
  };

  public static icons = {

      All:'\uf141',
      Gene:'\uf074',
      Compound:'\uf1e0', //\uf1d5
      Pathway:'\uf18b',
      Movie:'\uf008',
      Actor:'\uf183',
      Episode:'\uf008',
      Character:'\uf007',
      House:'\uf1d0',
      Director:'\uf0a1',

      User:'\uf007',

      smallCircle:'\uf111',
      Person:'\uf007',
      // Person:'\e802',
      Battle:'\uf05b',
      Culture:'\uf1ce',
      Dead:'\uf235',
      Book:'\uf02d',
      King:'\uf0e3',
      Knight:'\uf14e',
      Location:'\uf276',
      Region:'\uf1d1',
      Status:'\uf091',

      Search:'\uf002',
      Query:'\uf1e0',

      AdvancedSearch:'\uf20e',

      // AggregateIcon:'\uf009',
      AggregateIcon:'\uf04d',
      ModeIcon:'\uf111',

      Linearize:'\uf03a',

      Plus:'\uf067',
      Menu:'\uf141',

      ConferencePaper:'\uf0f6',
      Inproceedings:'\uf0f6',
      Proceedings:'\uf0f6',
      Journal:'\uf02d',
      CHI:'\uf21d',
      _Set_Node:'\uf0f6',
      Author:'\uf007',
      TVCG:'\uf1fe',
      Article:'\uf0f6',
      Publication:'\uf0f6',

      Review:'\uf002',
      City:'\uf0f7',
      Neighborhood:'\uf278',
      Host:'\uf0f4',
      Country:'\uf11d',
      State:'\uf279',
      Listing:'\uf274',
      Amenity:'\uf0f5',



      AddSubGraph:'\uf20e',
      AddNode:'\uf055',
      AddChildren:'\uf1e0',
      RemoveNode:'\uf057',
      RemoveChildren:'\uf1e0',
      MakeRoot:'\uf192',
      Add2Matrix:'\uf00a',
      Aggregate:'\uf0c9',

      settingsExpand:'\uf105',
      settingsCollapse:'\uf107',

      sortDesc:'\uf161',
      sortAsc:'\uf160',

      preview:'\uf06e',

      filter:'\uf0b0',

      arrowRight:'\uf0da',
      arrowDown:'\uf0d7',

      menu:'\uf141',
      settings:'\uf013',

      aggregateIcon:'\uf04d',


      edgeIcon:'\uf148'
  };

  public static colors = {
    Gene:'#B0CACF',
    Compound:'#CFA399',
    Pathway:'#9DBBAE',
    Movie:'#B0CACF',
    Actor:'#9DBBAE',
    Episode:'#B0CACF',
    Character:'#9DBBAE',
    House:'#CFA399'
};

  public static panelAttributeWidth = 300;
  public static panelAttributeHeight = 100;
  public static panelSVGwidth = 220;

  public static collapseSlopeChartWidth = 45;
  public static slopeChartWidth = 150;

  public static rowHeight = Config.glyphSize * 2.5 - 4;


  public static expPanelWidth = '300px';
  public static colGraphTableWidth = '100%';

  public static colPanelWidth = '30px';
  public static expGraphTableWidth = '100%';

  public static legendHeight = 150;


}
