import React from 'react';
import { FiSquare } from 'react-icons/fi';
import { BsCheckSquareFill } from 'react-icons/bs';

interface TemplateItem {
  id: string;
  name: string;
  dimensions: string;
  ratio: string;
  iconRatio: string;
  width: number;
  height: number;
}

interface TemplateCategory {
  category: string;
  items: TemplateItem[];
}

interface Props {
  templateData: TemplateCategory[];
  selectedTemplates: string[];
  allTemplateIds: string[];
  handleCheckboxChange: (id: string) => void;
  handleSelectAll: () => void;
}

const Templates: React.FC<Props> = ({
  templateData,
  selectedTemplates,
  allTemplateIds,
  handleCheckboxChange,
  handleSelectAll,
}) => (
  <div className="template-column space-y-4 bg-background/0">
    {/* Header */}
    <div className="column-header flex items-center justify-between">
      <h3 className="text-lg font-semibold text-foreground">
        Templates ({selectedTemplates.length} selected)
      </h3>
      <button
        onClick={handleSelectAll}
        className="select-all-button rounded-[30px] border border-primary text-primary px-4 py-2 hover:bg-primary/10 transition-colors"
      >
        {selectedTemplates.length === allTemplateIds.length
          ? 'Deselect All'
          : 'Select All'}
      </button>
    </div>

    {/* Template List */}
    <div className="template-list space-y-4">
      {templateData.length === 0 ? (
        <div className="no-templates text-muted-foreground">
          No templates available
        </div>
      ) : (
        templateData.map((category) => (
          <div key={category.category} className="template-category space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              {category.category}
            </h4>

            {category.items.map((item) => {
              const checked = selectedTemplates.includes(item.id);
              return (
                <div
                  key={item.id}
                  onClick={() => handleCheckboxChange(item.id)}
                  className={`template-item group flex items-center justify-between gap-4 rounded-[30px] border px-4 py-3 ml-1 border-border hover:ring-1 hover:ring-primary/40 transition cursor-pointer ${
                    checked ? 'ring-1 ring-primary/60' : ''
                  }`}
                >
                  <div className="flex items-center min-w-0">
                    {/* Checkbox icon */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation(); // prevent double toggle
                        handleCheckboxChange(item.id);
                      }}
                      className="mr-3 shrink-0 h-5 w-5 flex items-center justify-center"
                      title={checked ? 'Deselect' : 'Select'}
                    >
                      {checked ? (
                        <BsCheckSquareFill className="h-5 w-5 text-primary" />
                      ) : (
                        <FiSquare className="h-5 w-5 text-white" />
                      )}
                    </button>

                    {/* Template info */}
                    <div className="template-details flex flex-col sm:flex-row sm:items-center sm:gap-3 min-w-0">
                      <span className="template-name font-medium text-foreground truncate">
                        {item.name}
                      </span>
                      <span className="template-dims text-muted-foreground text-sm truncate">
                        {item.dimensions}
                      </span>
                    </div>
                  </div>

                  {/* Ratio indicator */}
                  <div className="aspect-ratio flex items-center gap-2 text-muted-foreground text-sm">
                    <div
                      className={`aspect-ratio-icon ratio-${item.iconRatio} h-5 w-3 rounded-md border border-border bg-muted/20`}
                    />
                    <span>{item.ratio}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ))
      )}
    </div>
  </div>
);

export default Templates;
