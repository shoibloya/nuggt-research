// components/SpreadsheetSlideOver.tsx

'use client'

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useFlowStore } from "@/storage/store"
import { Loader2, Trash, PlusCircle, Check, Settings } from 'lucide-react'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { v4 as uuidv4 } from "uuid"
import { DataGrid, GridColDef, GridRowModel, GridToolbar } from "@mui/x-data-grid"
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "react-toastify"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"

export default function SpreadsheetSlideOver() {
  const {
    openSpreadsheetNodeId,
    setOpenSpreadsheetNodeId,
    nodes,
    updateSpreadsheetData,
    updateColumnDefinitions,
  } = useFlowStore()

  const [stage, setStage] = useState<"initial" | "loading" | "editingColumns" | "ready">("initial")
  const [purpose, setPurpose] = useState("")
  const [columns, setColumns] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null)
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([])

  useEffect(() => {
    if (openSpreadsheetNodeId) {
      const nodeData = nodes.find((node) => node.id === openSpreadsheetNodeId)?.data
      if (nodeData?.rows) {
        setRows(nodeData.rows)
      } else {
        setRows([])
      }

      if (nodeData?.columnDefinitions?.length > 0) {
        // Set columns and ensure optionsText is populated
        const colsWithOptionsText = nodeData.columnDefinitions.map((col) => {
          if ((col.type === "Select" || col.type === "Label") && col.options) {
            return { ...col, optionsText: col.options.join(", ") }
          }
          return col
        })
        setColumns(colsWithOptionsText)
        setStage("ready")
      } else {
        setStage("initial")
      }
    } else {
      resetState()
    }
  }, [openSpreadsheetNodeId, nodes])

  const resetState = () => {
    setStage("initial")
    setPurpose("")
    setColumns([])
    setRows([])
    setError(null)
    setConfirmDelete(null)
  }

  const handlePurposeSubmit = async () => {
    if (purpose.trim() === "") {
      toast.error("Purpose cannot be empty.")
      return
    }
    setLoading(true)
    setStage("loading")
    setError(null)

    try {
      const response = await fetch("/api/generateSpreadsheetColumns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purpose }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate column definitions")
      }

      const data = await response.json()
      const columnsWithId = data.columns.map((col: any) => {
        const colWithId = {
          ...col,
          id: col.id || uuidv4(),
        }
        // If the column is of type Select or Label, set optionsText
        if ((col.type === "Select" || col.type === "Label") && col.options) {
          colWithId.optionsText = col.options.join(", ")
        }
        return colWithId
      })
      setColumns(columnsWithId)
      setStage("editingColumns")
      toast.success("Columns generated successfully!")
    } catch (error) {
      console.error(error)
      setError("An error occurred while generating columns. Please try again.")
      setStage("initial")
      toast.error("Failed to generate columns.")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteSelectedRows = () => {
    const updatedRows = rows.filter((row) => !selectedRowIds.includes(row.id))
    setRows(updatedRows)
    setSelectedRowIds([]) // Clear selection after deletion

    if (openSpreadsheetNodeId) {
      updateSpreadsheetData(openSpreadsheetNodeId, updatedRows)
    }
    toast.info(`${selectedRowIds.length} rows deleted.`)
  }

  const handleAddColumn = () => {
    const newColumn = {
      id: uuidv4(),
      name: `New Column ${columns.length + 1}`,
      description: "",
      type: "Text",
      options: [],
    };
    const updatedColumns = [...columns, newColumn];
    setColumns(updatedColumns);
    toast.success(`Added column "${newColumn.name}"`);
  };

  const confirmDeleteColumn = (id: string, name: string) => {
    setConfirmDelete({ id, name })
  }

  const handleDeleteColumn = () => {
    if (confirmDelete) {
      const updatedColumns = columns.filter((col) => col.id !== confirmDelete.id)
      setColumns(updatedColumns)
      setConfirmDelete(null)
      toast.info(`Column "${confirmDelete.name}" deleted.`)
    }
  }

  const handleConfirmColumns = () => {
    for (let col of columns) {
      if (col.name.trim() === "") {
        toast.error("All columns must have a name.")
        return
      }
    }

    // Update column definitions in the store
    if (openSpreadsheetNodeId) {
      // Before updating, handle any changes to rows due to column changes
      // For example, if columns were added or removed, adjust rows accordingly

      // Get the current columns in the store
      const nodeData = nodes.find((node) => node.id === openSpreadsheetNodeId)?.data
      const prevColumns = nodeData?.columnDefinitions || []

      // Compare previous columns and new columns to adjust rows
      const prevColumnIds = prevColumns.map((col) => col.id)
      const newColumnIds = columns.map((col) => col.id)

      // Columns that were removed
      const removedColumns = prevColumns.filter((col) => !newColumnIds.includes(col.id))
      // Columns that were added
      const addedColumns = columns.filter((col) => !prevColumnIds.includes(col.id))

      // Adjust rows
      let updatedRows = [...rows]

      // Remove data for removed columns
      if (removedColumns.length > 0) {
        updatedRows = updatedRows.map((row) => {
          const newRow = { ...row }
          removedColumns.forEach((col) => {
            delete newRow[col.id]
          })
          return newRow
        })
      }

      // Add empty data for added columns
      if (addedColumns.length > 0) {
        updatedRows = updatedRows.map((row) => {
          const newRow = { ...row }
          addedColumns.forEach((col) => {
            newRow[col.id] = ""
          })
          return newRow
        })
      }

      setRows(updatedRows)

      // Update the store
      updateColumnDefinitions(openSpreadsheetNodeId, columns)
      updateSpreadsheetData(openSpreadsheetNodeId, updatedRows)
    }
    setStage("ready")
    toast.success("Columns confirmed.")
  }

  const processRowUpdate = (newRow: GridRowModel) => {
    const updatedRows = rows.map((row) =>
      row.id === newRow.id ? { ...newRow, isNew: false } : row
    )
    setRows(updatedRows)
    if (openSpreadsheetNodeId) {
      updateSpreadsheetData(openSpreadsheetNodeId, updatedRows)
    }
    return { ...newRow, isNew: false }
  }

  const handleSlideOverClose = () => {
    resetState()
    setOpenSpreadsheetNodeId(null)
  }

  const gridColumns: GridColDef[] = columns.map((col) => {
    const gridCol: GridColDef = {
      field: col.id,
      headerName: col.name || "Unnamed",
      width: 150,
      editable: true,
      headerClassName: "bg-primary/10 font-semibold",
      align: "left",
      headerAlign: "left",
      valueOptions: [],
    }

    switch (col.type) {
      case "Number":
        gridCol.type = "number"
        break
      case "Checkbox":
        gridCol.type = "boolean"
        break
      case "Date d-m-y":
      case "Date m-d-y":
        gridCol.type = "date"
        break
      case "Select":
        gridCol.type = "singleSelect"
        gridCol.valueOptions = col.options || []
        break
      default:
        break
    }

    return gridCol
  })

  const rowsWithId = rows.map((row) => ({
    id: row.id || uuidv4(),
    ...row,
  }))

  const handleAddRow = () => {
    // Create a new row with default empty values for each column
    const newRow = columns.reduce(
      (acc, col) => ({ ...acc, [col.id]: "" }),
      { id: uuidv4() } // Assign a unique ID to the new row
    )

    // Add the new row to the rows state
    const updatedRows = [...rows, newRow]
    setRows(updatedRows)

    // Update the spreadsheet data in storage (if openSpreadsheetNodeId exists)
    if (openSpreadsheetNodeId) {
      updateSpreadsheetData(openSpreadsheetNodeId, updatedRows)
    }

    // Optionally log or notify the user about the new row
    console.log("Row added:", newRow)
  }

  // Function to handle column name change
  const handleColumnNameChange = (index: number, newName: string) => {
    const newColumns = [...columns]
    newColumns[index].name = newName
    setColumns(newColumns)
  }

  // Function to handle column type change
  const handleColumnTypeChange = (index: number, newType: string) => {
    const newColumns = [...columns]
    newColumns[index].type = newType
    setColumns(newColumns)
  }

  // Function to handle column description change
  const handleColumnDescriptionChange = (index: number, newDescription: string) => {
    const newColumns = [...columns]
    newColumns[index].description = newDescription
    setColumns(newColumns)
  }

  // Function to handle column options change
  const handleColumnOptionsChange = (index: number, optionsText: string) => {
    const newColumns = [...columns];
    newColumns[index].optionsText = optionsText;
    newColumns[index].options = optionsText
      .split(",")
      .map((opt) => opt.trim())
      .filter((opt) => opt);
    setColumns(newColumns);
  }

  return (
    <TooltipProvider>
      {openSpreadsheetNodeId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <Card className="max-w-[90vw] w-full max-h-[90vh] p-0 overflow-hidden flex flex-col">
            {/* VisuallyHidden for accessibility */}
            <VisuallyHidden>
              <h2>
                {nodes.find((node) => node.id === openSpreadsheetNodeId)?.data?.label || "Spreadsheet Editor"}
              </h2>
            </VisuallyHidden>

            {/* Header */}
            <div className="p-6 border-b border-gray-200 flex justify-between items-center flex-shrink-0">
              <h1 className="text-3xl font-bold text-center flex-1">
                {nodes.find((node) => node.id === openSpreadsheetNodeId)?.data?.label || "Spreadsheet"}
              </h1>
              <Button
                variant="secondary"
                onClick={handleSlideOverClose}
                className="flex items-center space-x-2 ml-4"
              >
                <Trash className="h-4 w-4" />
                <span>Close</span>
              </Button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-auto p-6">
              {(() => {
                switch (stage) {
                  case "initial":
                    return (
                      <Card className="max-w-md mx-auto">
                        <CardContent className="pt-6">
                          <div className="space-y-4">
                            <Label htmlFor="purpose" className="text-lg font-medium">
                              Enter the purpose of the spreadsheet:
                            </Label>
                            <Input
                              id="purpose"
                              placeholder="e.g., Track monthly expenses"
                              value={purpose}
                              onChange={(e) => setPurpose(e.target.value)}
                            />
                            <Button
                              onClick={handlePurposeSubmit}
                              disabled={loading}
                              className="w-full flex justify-center items-center space-x-2"
                            >
                              {loading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <PlusCircle className="h-4 w-4" />
                              )}
                              <span>Generate Columns</span>
                            </Button>
                            {error && <p className="text-destructive text-sm">{error}</p>}
                          </div>
                        </CardContent>
                      </Card>
                    )
                  case "loading":
                    return (
                      <div className="flex justify-center items-center h-full">
                        <Loader2 className="h-12 w-12 animate-spin text-primary" />
                      </div>
                    )
                  case "editingColumns":
                    return (
                      <div className="space-y-6">
                        <div className="flex justify-between items-center">
                          <h2 className="text-2xl font-bold">Edit Columns</h2>
                          <div className="flex space-x-2">
                            <Button
                              onClick={handleAddColumn}
                              className="flex items-center space-x-2"
                            >
                              <PlusCircle className="h-5 w-5" />
                              <span>Add Column</span>
                            </Button>
                        
                            <Button
                              onClick={handleConfirmColumns}
                              variant="primary"
                              size="sm"
                              className="flex items-center space-x-2"
                            >
                              <Check className="h-4 w-4" />
                              <span>Confirm</span>
                            </Button>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {columns.map((col, index) => (
                            <Card key={col.id} className="p-4 shadow-md hover:shadow-lg transition-shadow bg-card/50 backdrop-blur-sm">
                              <div className="flex justify-between items-start mb-4">
                                <Input
                                  placeholder="Column Name"
                                  value={col.name}
                                  onChange={(e) => handleColumnNameChange(index, e.target.value)}
                                  className="flex-1 mr-2"
                                />
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="destructive"
                                      size="icon"
                                      onClick={() => confirmDeleteColumn(col.id, col.name)}
                                      aria-label={`Delete column ${col.name}`}
                                    >
                                      <Trash className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Delete column</TooltipContent>
                                </Tooltip>
                              </div>
                              <Select
                                onValueChange={(value) => handleColumnTypeChange(index, value)}
                                value={col.type}
                                className="w-full"
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select Type" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Text">Text</SelectItem>
                                  <SelectItem value="Number">Number</SelectItem>
                                  <SelectItem value="Currency">Currency</SelectItem>
                                  <SelectItem value="Date d-m-y">Date d-m-y</SelectItem>
                                  <SelectItem value="Date m-d-y">Date m-d-y</SelectItem>
                                  <SelectItem value="Checkbox">Checkbox</SelectItem>
                                  <SelectItem value="Select">Select</SelectItem>
                                  <SelectItem value="Label">Label</SelectItem>
                                </SelectContent>
                              </Select>
                              <Input
                                placeholder="Description"
                                value={col.description || ''}
                                onChange={(e) => handleColumnDescriptionChange(index, e.target.value)}
                                className="mt-2"
                              />
                              {(col.type === "Select" || col.type === "Label") && (
                                <div className="mt-2">
                                  <Label className="mb-1 block">Options</Label>
                                  <Textarea
                                    placeholder="Enter options separated by commas"
                                    value={col.optionsText || ""}
                                    onChange={(e) => handleColumnOptionsChange(index, e.target.value)}
                                    className="resize-none"
                                  />
                                </div>
                              )}
                            </Card>
                          ))}
                        </div>
                      </div>
                    )
                  case "ready":
                    return (
                      <div className="flex flex-col h-full">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-medium">Spreadsheet Data</h3>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleAddRow}
                              className="flex items-center space-x-2"
                            >
                              <PlusCircle className="h-4 w-4 mr-2" />
                              <span>Add Row</span>
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={handleDeleteSelectedRows}
                              className="flex items-center space-x-2"
                              disabled={selectedRowIds.length === 0}
                            >
                              <Trash className="h-4 w-4 mr-2" />
                              <span>Delete Selected Rows</span>
                            </Button>
                            {/* Column Options Button */}
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => setStage("editingColumns")}
                              className="flex items-center space-x-2"
                            >
                              <Settings className="h-4 w-4 mr-2" />
                              <span>Column Options</span>
                            </Button>
                          </div>
                        </div>
                        <div className="flex-1 overflow-auto">
                          <DataGrid
                            rows={rowsWithId}
                            columns={gridColumns}
                            processRowUpdate={processRowUpdate}
                            checkboxSelection
                            disableRowSelectionOnClick
                            className="bg-background border rounded-lg overflow-hidden"
                            hideFooter
                            style={{ height: '100%' }}
                            experimentalFeatures={{ newEditingApi: true }}
                            onRowSelectionModelChange={(newSelection) => {
                              setSelectedRowIds(newSelection as string[])
                            }}
                            slots={{ toolbar: GridToolbar }}
                          />
                        </div>
                      </div>
                    )
                  default:
                    return null
                }
              })()}
            </div>
          </Card>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <Card className="sm:max-w-[425px] w-full p-6">
            <VisuallyHidden>
              <h2>Confirm Deletion</h2>
            </VisuallyHidden>
            <div className="py-4">
              <p>Are you sure you want to delete the column "{confirmDelete.name}"?</p>
            </div>
            <div className="flex justify-end space-x-4">
              <Button variant="outline" onClick={() => setConfirmDelete(null)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteColumn}>
                <Trash className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </Card>
        </div>
      )}
    </TooltipProvider>
  )
}
